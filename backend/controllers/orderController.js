const { query } = require('../config/db');
const { createNotification } = require('./notificationController');

// Place / Create Order
async function createOrder(req, res) {
  try {
    const userId = req.user.id;
    const {
      recipient_name,
      phone,
      shipping_address,
      city,
      state,
      postal_code,
      payment_method = 'Cash on Delivery',
      notes = '',
      items: directItems // In case user buys directly without cart
    } = req.body;

    if (!recipient_name || !phone || !shipping_address || !city || !state || !postal_code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complete delivery details (Recipient name, phone, address, city, state, postal code).'
      });
    }

    let orderItems = [];

    if (directItems && Array.isArray(directItems) && directItems.length > 0) {
      // Direct "Buy Now" flow
      for (const item of directItems) {
        const prods = await query('SELECT id, name, price, stock, image_url FROM products WHERE id = ?', [item.productId]);
        if (prods && prods.length > 0) {
          const p = prods[0];
          orderItems.push({
            product_id: p.id,
            product_name: p.name,
            price: Number(p.price),
            quantity: Number(item.quantity || 1),
            subtotal: Number(p.price) * Number(item.quantity || 1),
            image_url: p.image_url,
            stock: p.stock
          });
        }
      }
    } else {
      // Cart items flow
      const cartRows = await query(`
        SELECT c.*, p.name, p.price, p.stock, p.image_url
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
      `, [userId]);

      if (!cartRows || cartRows.length === 0) {
        return res.status(400).json({ success: false, message: 'Your shopping cart is empty. Please add products first.' });
      }

      orderItems = cartRows.map(c => ({
        product_id: c.product_id,
        product_name: c.name,
        price: Number(c.price),
        quantity: Number(c.quantity),
        subtotal: Number(c.price) * Number(c.quantity),
        image_url: c.image_url,
        stock: c.stock
      }));
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid products in this order.' });
    }

    // Check stock for all items
    for (const item of orderItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for "${item.product_name}". Available: ${item.stock}, Requested: ${item.quantity}`
        });
      }
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = subtotal > 100 ? 0.00 : 9.99;
    const tax = subtotal * 0.05;
    const totalAmount = Number((subtotal + shippingFee + tax).toFixed(2));

    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentStatus = payment_method === 'Cash on Delivery' ? 'Pending' : 'Paid';
    const orderStatus = 'Placed';

    // Insert Order header
    const orderResult = await query(`
      INSERT INTO orders 
      (order_number, user_id, total_amount, shipping_fee, discount_amount, recipient_name, phone, shipping_address, city, state, postal_code, payment_method, payment_status, order_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderNumber,
      userId,
      totalAmount,
      shippingFee,
      0.00,
      recipient_name.trim(),
      phone.trim(),
      shipping_address.trim(),
      city.trim(),
      state.trim(),
      postal_code.trim(),
      payment_method,
      paymentStatus,
      orderStatus,
      notes || null
    ]);

    const orderId = orderResult.insertId;

    // Insert Order items & decrement stock
    for (const item of orderItems) {
      await query(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.product_name, item.price, item.quantity, item.subtotal, item.image_url]);

      // Decrement stock
      await query('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [item.quantity, item.product_id]);
    }

    // Clear user cart
    await query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    // Send customer notification
    await createNotification(
      userId,
      orderId,
      'Order Placed Successfully! 🛍️',
      `Your order #${orderNumber} for $${totalAmount.toFixed(2)} has been placed. We are preparing it for shipment.`,
      'order_placed'
    );

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! Thank you for your purchase.',
      order: {
        id: orderId,
        order_number: orderNumber,
        total_amount: totalAmount,
        payment_method,
        payment_status: paymentStatus,
        order_status: orderStatus,
        recipient_name,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('createOrder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to place order. Please try again.' });
  }
}

// Get Logged In User's Orders
async function getMyOrders(req, res) {
  try {
    const userId = req.user.id;

    let orders;
    try {
      orders = await query(`
        SELECT 
          o.*,
          agent.name as delivery_agent_name,
          agent.phone as delivery_agent_phone,
          agent.avatar_url as delivery_agent_avatar
        FROM orders o
        LEFT JOIN users agent ON o.delivery_agent_id = agent.id
        WHERE o.user_id = ? 
        ORDER BY o.id DESC
      `, [userId]);
    } catch (e) {
      orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [userId]);
    }

    // Attach order items for each order
    const populatedOrders = await Promise.all(orders.map(async (ord) => {
      const items = await query('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
      return {
        ...ord,
        items: items || []
      };
    }));

    return res.json({
      success: true,
      count: populatedOrders.length,
      orders: populatedOrders
    });
  } catch (error) {
    console.error('getMyOrders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
}

// Get Single Order By ID or Order Number
async function getOrderById(req, res) {
  try {
    const identifier = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administrator';

    let orders;
    try {
      if (isNaN(Number(identifier))) {
        orders = await query(`
          SELECT 
            o.*,
            agent.name as delivery_agent_name,
            agent.phone as delivery_agent_phone,
            agent.avatar_url as delivery_agent_avatar
          FROM orders o
          LEFT JOIN users agent ON o.delivery_agent_id = agent.id
          WHERE o.order_number = ?
        `, [identifier]);
      } else {
        orders = await query(`
          SELECT 
            o.*,
            agent.name as delivery_agent_name,
            agent.phone as delivery_agent_phone,
            agent.avatar_url as delivery_agent_avatar
          FROM orders o
          LEFT JOIN users agent ON o.delivery_agent_id = agent.id
          WHERE o.id = ?
        `, [Number(identifier)]);
      }
    } catch (e) {
      if (isNaN(Number(identifier))) {
        orders = await query('SELECT * FROM orders WHERE order_number = ?', [identifier]);
      } else {
        orders = await query('SELECT * FROM orders WHERE id = ?', [Number(identifier)]);
      }
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orders[0];

    // Authorization check
    if (!isAdmin && order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own orders.' });
    }

    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

    return res.json({
      success: true,
      order: {
        ...order,
        items: items || []
      }
    });
  } catch (error) {
    console.error('getOrderById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order details.' });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById
};
