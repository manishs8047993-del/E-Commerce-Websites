const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { createNotification } = require('./notificationController');

// 1. Get Dashboard Overview Metrics
async function getStats(req, res) {
  try {
    // Total Revenue (excluding cancelled orders)
    const revRes = await query(`
      SELECT COALESCE(SUM(total_amount), 0) as totalRevenue 
      FROM orders 
      WHERE order_status != 'Cancelled'
    `);
    const totalRevenue = Number(revRes[0]?.totalRevenue || 0);

    // Total Orders
    const ordRes = await query('SELECT COUNT(*) as totalOrders FROM orders');
    const totalOrders = Number(ordRes[0]?.totalOrders || 0);

    // Total Products
    const prodRes = await query('SELECT COUNT(*) as totalProducts FROM products');
    const totalProducts = Number(prodRes[0]?.totalProducts || 0);

    // Total Customers
    const custRes = await query("SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'customer'");
    const totalCustomers = Number(custRes[0]?.totalCustomers || 0);

    // Orders breakdown by status
    const statusRows = await query(`
      SELECT order_status, COUNT(*) as count 
      FROM orders 
      GROUP BY order_status
    `);
    const statusMap = { Placed: 0, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
    if (Array.isArray(statusRows)) {
      statusRows.forEach(row => {
        if (row.order_status) statusMap[row.order_status] = Number(row.count);
      });
    }

    // Payment breakdown
    const paymentRows = await query(`
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE order_status != 'Cancelled'
      GROUP BY payment_method
    `);

    // Recent 6 Orders with user info
    let recentOrders = [];
    try {
      recentOrders = await query(`
        SELECT o.*, u.name as customer_name, u.email as customer_email 
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.id DESC 
        LIMIT 6
      `);
    } catch (e) {
      recentOrders = await query('SELECT * FROM orders ORDER BY id DESC LIMIT 6');
    }

    // Top Selling / Featured Products
    const topProducts = await query(`
      SELECT p.id, p.name, p.price, p.stock, p.rating, p.image_url, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.rating DESC, p.num_reviews DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        statusBreakdown: statusMap,
        paymentBreakdown: paymentRows || [],
        recentOrders: recentOrders || [],
        topProducts: topProducts || []
      }
    });
  } catch (error) {
    console.error('getStats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
  }
}

// 2. View All Orders (with filters & search)
async function getOrders(req, res) {
  try {
    const { status, search, my_deliveries } = req.query;

    let sql = `
      SELECT 
        o.*, 
        u.name as customer_name, 
        u.email as customer_email, 
        u.phone as customer_phone,
        agent.name as delivery_agent_name,
        agent.phone as delivery_agent_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users agent ON o.delivery_agent_id = agent.id
      WHERE 1=1
    `;
    const params = [];

    if (my_deliveries === 'true' && req.user && req.user.role === 'delivery_agent') {
      sql += ' AND o.delivery_agent_id = ?';
      params.push(req.user.id);
    }

    if (status && status !== 'all') {
      sql += ' AND o.order_status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (o.order_number LIKE ? OR o.recipient_name LIKE ? OR u.email LIKE ? OR o.city LIKE ? OR agent.name LIKE ?)';
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY o.id DESC';

    const orders = await query(sql, params);

    // Fetch items for each order
    const fullOrders = await Promise.all(
      (orders || []).map(async (ord) => {
        const items = await query('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
        return {
          ...ord,
          items: items || []
        };
      })
    );

    return res.json({
      success: true,
      count: fullOrders.length,
      orders: fullOrders
    });
  } catch (error) {
    console.error('getOrders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
}

// 3. Update Order Status & Payment Status
async function updateOrderStatus(req, res) {
  try {
    const orderId = Number(req.params.id);
    const { order_status, payment_status, notes } = req.body;

    const validStatuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (order_status && !validStatuses.includes(order_status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status value.' });
    }

    const updates = [];
    const params = [];

    if (order_status) {
      updates.push('order_status = ?');
      params.push(order_status);
    }

    if (payment_status) {
      updates.push('payment_status = ?');
      params.push(payment_status);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No update parameters provided.' });
    }

    params.push(orderId);
    await query(`UPDATE orders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);

    const updated = await query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!updated || updated.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Trigger real-time customer notification
    if (order_status) {
      const statusTitles = {
        'Processing': 'Order Being Prepared 📦',
        'Shipped': 'Order Shipped & In Transit 🚚',
        'Delivered': 'Order Delivered 🎉',
        'Cancelled': 'Order Cancelled ⚠️',
        'Placed': 'Order Placed 🛍️'
      };
      const statusMessages = {
        'Processing': `Your order #${updated[0].order_number} is being packed and prepared for dispatch.`,
        'Shipped': `Great news! Your order #${updated[0].order_number} is on the way.`,
        'Delivered': `Your order #${updated[0].order_number} has been delivered successfully. Thank you for shopping with NovaStore!`,
        'Cancelled': `Your order #${updated[0].order_number} has been cancelled.`,
        'Placed': `Your order #${updated[0].order_number} has been placed.`
      };
      await createNotification(
        updated[0].user_id,
        updated[0].id,
        statusTitles[order_status] || `Order Status Updated: ${order_status}`,
        statusMessages[order_status] || `Your order #${updated[0].order_number} status is now ${order_status}.`,
        `order_${order_status.toLowerCase()}`
      );
    }

    return res.json({
      success: true,
      message: `Order #${updated[0].order_number} status updated to ${order_status || updated[0].order_status}.`,
      order: updated[0]
    });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
}

// 4. View All Registered Customers
async function getCustomers(req, res) {
  try {
    const customers = await query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone, 
        u.address, 
        u.city, 
        u.state, 
        u.postal_code, 
        u.avatar_url, 
        u.created_at,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(CASE WHEN o.order_status != 'Cancelled' THEN o.total_amount ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.id DESC
    `);

    return res.json({
      success: true,
      count: customers.length,
      customers: customers || []
    });
  } catch (error) {
    console.error('getCustomers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve customers.' });
  }
}

// 5. Add / Create New Product
async function addProduct(req, res) {
  try {
    const { name, description, price, original_price, category_id, stock, image_url, brand, is_featured } = req.body;

    if (!name || !price || !category_id || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, category, and image URL are required.'
      });
    }

    const result = await query(`
      INSERT INTO products 
      (name, description, price, original_price, category_id, stock, image_url, brand, is_featured, rating, num_reviews)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 0)
    `, [
      name.trim(),
      description ? description.trim() : '',
      Number(price),
      original_price ? Number(original_price) : null,
      Number(category_id),
      stock !== undefined ? Number(stock) : 10,
      image_url.trim(),
      brand ? brand.trim() : 'Store Brand',
      is_featured ? 1 : 0
    ]);

    const newProd = await query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: `Product "${name}" created successfully!`,
      product: newProd[0]
    });
  } catch (error) {
    console.error('addProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add product.' });
  }
}

// 6. Update Product
async function updateProduct(req, res) {
  try {
    const prodId = Number(req.params.id);
    const { name, description, price, original_price, category_id, stock, image_url, brand, is_featured } = req.body;

    const existing = await query('SELECT id FROM products WHERE id = ?', [prodId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await query(`
      UPDATE products SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        original_price = ?,
        category_id = COALESCE(?, category_id),
        stock = COALESCE(?, stock),
        image_url = COALESCE(?, image_url),
        brand = COALESCE(?, brand),
        is_featured = COALESCE(?, is_featured)
      WHERE id = ?
    `, [
      name ? name.trim() : null,
      description !== undefined ? description : null,
      price ? Number(price) : null,
      original_price !== undefined ? (original_price ? Number(original_price) : null) : null,
      category_id ? Number(category_id) : null,
      stock !== undefined ? Number(stock) : null,
      image_url ? image_url.trim() : null,
      brand ? brand.trim() : null,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      prodId
    ]);

    const updated = await query('SELECT * FROM products WHERE id = ?', [prodId]);

    return res.json({
      success: true,
      message: 'Product updated successfully!',
      product: updated[0]
    });
  } catch (error) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
}

// 7. Delete Product
async function deleteProduct(req, res) {
  try {
    const prodId = Number(req.params.id);
    const existing = await query('SELECT id, name FROM products WHERE id = ?', [prodId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await query('DELETE FROM products WHERE id = ?', [prodId]);

    return res.json({
      success: true,
      message: `Product "${existing[0].name}" has been deleted.`
    });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
}

// 8. Manage Categories (Get, Add, Delete)
async function getCategories(req, res) {
  try {
    const categories = await query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    return res.json({
      success: true,
      categories: categories || []
    });
  } catch (error) {
    console.error('getCategories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
}

async function addCategory(req, res) {
  try {
    const { name, slug, icon, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const catSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const result = await query(`
      INSERT INTO categories (name, slug, icon, description)
      VALUES (?, ?, ?, ?)
    `, [name.trim(), catSlug, icon || 'fas fa-box', description || null]);

    const newCat = await query('SELECT * FROM categories WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: `Category "${name}" created successfully!`,
      category: newCat[0]
    });
  } catch (error) {
    console.error('addCategory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add category.' });
  }
}

async function deleteCategory(req, res) {
  try {
    const catId = Number(req.params.id);
    await query('DELETE FROM categories WHERE id = ?', [catId]);
    return res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
}

// 9. View Payments (Matching Diagram)
async function getPayments(req, res) {
  try {
    const payments = await query(`
      SELECT 
        o.id as order_id,
        o.order_number,
        o.recipient_name,
        o.payment_method,
        o.payment_status,
        o.total_amount,
        o.order_status,
        o.created_at,
        u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC
    `);

    const summary = {
      totalCollected: payments.filter(p => p.payment_status === 'Paid').reduce((sum, p) => sum + Number(p.total_amount), 0),
      pendingCOD: payments.filter(p => p.payment_status === 'Pending' && p.payment_method === 'Cash on Delivery').reduce((sum, p) => sum + Number(p.total_amount), 0),
      totalTransactions: payments.length
    };

    return res.json({
      success: true,
      summary,
      payments: payments || []
    });
  } catch (error) {
    console.error('getPayments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payments.' });
  }
}

// 10. Generate Reports & Analytics (Matching Diagram)
async function getReports(req, res) {
  try {
    const categorySales = await query(`
      SELECT c.name as category_name, COUNT(oi.id) as units_sold, COALESCE(SUM(oi.subtotal), 0) as total_sales
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.order_status != 'Cancelled'
      GROUP BY c.id
      ORDER BY total_sales DESC
    `);

    const topProducts = await query(`
      SELECT p.name, p.price, COALESCE(SUM(oi.quantity), 0) as quantity_sold, COALESCE(SUM(oi.subtotal), 0) as revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.order_status != 'Cancelled'
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 10
    `);

    const totalOrdersRes = await query('SELECT COUNT(*) as count FROM orders');
    const totalRevRes = await query("SELECT COALESCE(SUM(total_amount), 0) as rev FROM orders WHERE order_status != 'Cancelled'");
    const totalRev = Number(totalRevRes[0]?.rev || 0);
    const totalOrders = Number(totalOrdersRes[0]?.count || 0);
    const avgOrderValue = totalOrders > 0 ? (totalRev / totalOrders).toFixed(2) : '0.00';

    return res.json({
      success: true,
      reports: {
        totalRevenue: totalRev,
        totalOrders,
        averageOrderValue: avgOrderValue,
        categorySales: categorySales || [],
        topProducts: topProducts || []
      }
    });
  } catch (error) {
    console.error('getReports error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate reports.' });
  }
}

// 11. Staff Management (Admin Only)
async function getStaff(req, res) {
  try {
    const staff = await query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.phone, 
        u.address, 
        u.city, 
        u.state, 
        u.postal_code, 
        u.avatar_url, 
        u.created_at,
        COUNT(o.id) as assigned_deliveries
      FROM users u
      LEFT JOIN orders o ON u.id = o.delivery_agent_id
      WHERE u.role != 'customer'
      GROUP BY u.id
      ORDER BY u.id ASC
    `);

    return res.json({
      success: true,
      count: staff.length,
      staff: staff || []
    });
  } catch (error) {
    console.error('getStaff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve staff members.' });
  }
}

async function addStaff(req, res) {
  try {
    const { name, email, password, role = 'delivery_agent', phone, address, city, state, postal_code } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const validRoles = ['admin', 'delivery_agent', 'staff'];
    const normalizedRole = role.toLowerCase().trim();
    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Role must be either "admin" or "delivery_agent".' });
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A user or staff member with this email already exists.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatar = normalizedRole === 'admin'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80';

    const result = await query(`
      INSERT INTO users (name, email, password, role, avatar_url, phone, address, city, state, postal_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      email.toLowerCase().trim(),
      hashedPassword,
      normalizedRole,
      defaultAvatar,
      phone || null,
      address || null,
      city || null,
      state || null,
      postal_code || null
    ]);

    const newStaff = await query('SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: `Staff member "${name}" (${normalizedRole}) created successfully!`,
      staff: newStaff[0]
    });
  } catch (error) {
    console.error('addStaff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create staff member.' });
  }
}

async function updateStaff(req, res) {
  try {
    const staffId = Number(req.params.id);
    const { name, role, phone, address, city, password } = req.body;

    const existing = await query('SELECT * FROM users WHERE id = ?', [staffId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name.trim()); }
    if (role) {
      const validRoles = ['admin', 'delivery_agent', 'staff', 'customer'];
      if (validRoles.includes(role.toLowerCase().trim())) {
        updates.push('role = ?');
        params.push(role.toLowerCase().trim());
      }
    }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (city !== undefined) { updates.push('city = ?'); params.push(city); }

    if (password && password.trim().length >= 6) {
      const hash = await bcrypt.hash(password.trim(), 10);
      updates.push('password = ?');
      params.push(hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No update data provided.' });
    }

    params.push(staffId);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await query('SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = ?', [staffId]);

    return res.json({
      success: true,
      message: 'Staff details updated successfully!',
      staff: updated[0]
    });
  } catch (error) {
    console.error('updateStaff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update staff member.' });
  }
}

async function deleteStaff(req, res) {
  try {
    const staffId = Number(req.params.id);
    const currentAdminId = req.user.id;

    if (staffId === currentAdminId) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own logged-in admin account.' });
    }

    const existing = await query('SELECT id, name, role FROM users WHERE id = ?', [staffId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    await query('DELETE FROM users WHERE id = ?', [staffId]);

    return res.json({
      success: true,
      message: `Staff member "${existing[0].name}" removed successfully.`
    });
  } catch (error) {
    console.error('deleteStaff error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove staff member.' });
  }
}

async function assignDeliveryAgent(req, res) {
  try {
    const orderId = Number(req.params.orderId);
    const { delivery_agent_id } = req.body;

    await query('UPDATE orders SET delivery_agent_id = ? WHERE id = ?', [delivery_agent_id || null, orderId]);

    const orderRows = await query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orderRows && orderRows.length > 0) {
      const order = orderRows[0];
      if (delivery_agent_id) {
        const agentRows = await query('SELECT name, phone FROM users WHERE id = ?', [delivery_agent_id]);
        const agentName = agentRows[0]?.name || 'Delivery Partner';
        const agentPhone = agentRows[0]?.phone ? ` (Contact: ${agentRows[0].phone})` : '';
        await createNotification(
          order.user_id,
          order.id,
          'Delivery Agent Assigned 🛵',
          `Courier partner ${agentName}${agentPhone} has been assigned to deliver your order #${order.order_number}.`,
          'agent_assigned'
        );
      }
    }

    return res.json({ success: true, message: 'Delivery agent assigned to order successfully!' });
  } catch (error) {
    console.error('assignDeliveryAgent error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign delivery agent.' });
  }
}

module.exports = {
  getStats,
  getOrders,
  updateOrderStatus,
  getCustomers,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  addCategory,
  deleteCategory,
  getPayments,
  getReports,
  getStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  assignDeliveryAgent
};
