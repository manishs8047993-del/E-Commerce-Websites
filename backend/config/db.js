const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { getSeedData } = require('../database/seedData');

dotenv.config();

let pool = null;
let useFallback = false;

// In-memory fallback store in case MySQL is not actively running locally
const memoryStore = {
  users: [],
  categories: [],
  products: [],
  cart_items: [],
  orders: [],
  order_items: [],
  reviews: [],
  notifications: [],
  nextIds: {
    users: 20,
    categories: 20,
    products: 100,
    cart_items: 500,
    orders: 50,
    order_items: 100,
    reviews: 50,
    notifications: 100
  }
};

// Initialize In-Memory fallback store with seed data
async function initMemoryStore() {
  const seed = await getSeedData();
  memoryStore.users = [...seed.users];
  memoryStore.categories = [...seed.categories];
  memoryStore.products = [...seed.products];
  memoryStore.reviews = [...seed.reviews];

  // Populate demo orders and order items
  seed.demoOrders.forEach(ord => {
    const { items, ...orderHeader } = ord;
    memoryStore.orders.push(orderHeader);
    if (items && items.length) {
      items.forEach(item => {
        memoryStore.order_items.push({ ...item, order_id: ord.id });
      });
    }
  });
  console.log('⚡ [Fallback Store] In-memory database initialized with sample products, categories, users, and orders.');
}

// Initialize MySQL database tables and seed data
async function initMySQL() {
  try {
    // 1. Initial connection to create database if not exists
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    const dbName = process.env.DB_NAME || 'ecommerce_db';
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await tempConnection.end();

    // 2. Main Pool Connection
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Check if products table exists and has category_id column
    try {
      const [prodColumns] = await pool.query('SHOW COLUMNS FROM `products` LIKE "category_id"');
      if (prodColumns.length === 0) {
        console.log('🔄 Upgrading legacy database tables to new full-featured schema...');
        await pool.query('DROP TABLE IF EXISTS `order_items`, `orders`, `cart_items`, `reviews`, `products`, `categories`, `users`');
      }
    } catch (e) {
      // Table doesn't exist yet, proceed with normal creation
    }

    // Add avatar_url & modify role column for staff support
    try {
      await pool.query('ALTER TABLE `users` ADD COLUMN `avatar_url` TEXT DEFAULT NULL AFTER `role`');
    } catch (e) {}

    try {
      await pool.query("ALTER TABLE `users` MODIFY COLUMN `role` VARCHAR(50) DEFAULT 'customer'");
    } catch (e) {}

    // Add delivery_agent_id to orders
    try {
      await pool.query('ALTER TABLE `orders` ADD COLUMN `delivery_agent_id` INT DEFAULT NULL AFTER `user_id`');
    } catch (e) {}

    // 3. Create tables if they do not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(120) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`role\` VARCHAR(50) DEFAULT 'customer',
        \`avatar_url\` TEXT DEFAULT NULL,
        \`phone\` VARCHAR(20) DEFAULT NULL,
        \`address\` TEXT DEFAULT NULL,
        \`city\` VARCHAR(50) DEFAULT NULL,
        \`state\` VARCHAR(50) DEFAULT NULL,
        \`postal_code\` VARCHAR(20) DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`categories\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`slug\` VARCHAR(100) NOT NULL UNIQUE,
        \`icon\` VARCHAR(50) DEFAULT 'fas fa-box',
        \`description\` TEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`products\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(200) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`price\` DECIMAL(10, 2) NOT NULL,
        \`original_price\` DECIMAL(10, 2) DEFAULT NULL,
        \`category_id\` INT DEFAULT NULL,
        \`stock\` INT NOT NULL DEFAULT 10,
        \`image_url\` TEXT NOT NULL,
        \`rating\` DECIMAL(3, 2) DEFAULT 4.50,
        \`num_reviews\` INT DEFAULT 0,
        \`is_featured\` BOOLEAN DEFAULT FALSE,
        \`brand\` VARCHAR(100) DEFAULT 'Store Brand',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`cart_items\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`product_id\` INT NOT NULL,
        \`quantity\` INT NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE,
        UNIQUE KEY \`user_product_unique\` (\`user_id\`, \`product_id\`)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`order_number\` VARCHAR(50) NOT NULL UNIQUE,
        \`user_id\` INT NOT NULL,
        \`total_amount\` DECIMAL(10, 2) NOT NULL,
        \`shipping_fee\` DECIMAL(10, 2) DEFAULT 0.00,
        \`discount_amount\` DECIMAL(10, 2) DEFAULT 0.00,
        \`recipient_name\` VARCHAR(100) NOT NULL,
        \`phone\` VARCHAR(20) NOT NULL,
        \`shipping_address\` TEXT NOT NULL,
        \`city\` VARCHAR(50) NOT NULL,
        \`state\` VARCHAR(50) NOT NULL,
        \`postal_code\` VARCHAR(20) NOT NULL,
        \`payment_method\` ENUM('Cash on Delivery', 'Credit/Debit Card', 'UPI / Net Banking') DEFAULT 'Cash on Delivery',
        \`payment_status\` ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending',
        \`order_status\` ENUM('Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Placed',
        \`notes\` TEXT DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`order_items\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`order_id\` INT NOT NULL,
        \`product_id\` INT DEFAULT NULL,
        \`product_name\` VARCHAR(200) NOT NULL,
        \`price\` DECIMAL(10, 2) NOT NULL,
        \`quantity\` INT NOT NULL,
        \`subtotal\` DECIMAL(10, 2) NOT NULL,
        \`image_url\` TEXT DEFAULT NULL,
        FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`reviews\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`product_id\` INT NOT NULL,
        \`user_id\` INT NOT NULL,
        \`user_name\` VARCHAR(100) NOT NULL,
        \`rating\` INT NOT NULL DEFAULT 5,
        \`comment\` TEXT NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`user_id\` INT NOT NULL,
        \`order_id\` INT DEFAULT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`type\` VARCHAR(50) DEFAULT 'order_update',
        \`is_read\` BOOLEAN DEFAULT FALSE,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 4. Check if users & products table has complete catalog data
    const [existingUsers] = await pool.query('SELECT COUNT(*) as count FROM `users`');
    const [existingProducts] = await pool.query('SELECT COUNT(*) as count FROM `products`');
    const seed = await getSeedData();

    if (existingUsers[0].count === 0) {
      console.log('🌱 Seeding initial users...');
      for (const u of seed.users) {
        await pool.query(
          'INSERT IGNORE INTO users (id, name, email, password, role, phone, address, city, state, postal_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [u.id, u.name, u.email, u.password, u.role, u.phone, u.address, u.city, u.state, u.postal_code, u.created_at]
        );
      }
    }

    // Ensure all categories exist
    for (const c of seed.categories) {
      await pool.query(
        'INSERT INTO categories (id, name, slug, icon, description) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon), description=VALUES(description)',
        [c.id, c.name, c.slug, c.icon, c.description]
      );
    }

    if (existingProducts[0].count < 60) {
      console.log(`🌱 Seeding full product catalog (${seed.products.length} products)...`);
      for (const p of seed.products) {
        await pool.query(
          'INSERT INTO products (id, name, description, price, original_price, category_id, stock, image_url, rating, num_reviews, is_featured, brand) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), price=VALUES(price), original_price=VALUES(original_price), category_id=VALUES(category_id), stock=VALUES(stock), image_url=VALUES(image_url), rating=VALUES(rating), num_reviews=VALUES(num_reviews), is_featured=VALUES(is_featured), brand=VALUES(brand)',
          [p.id, p.name, p.description, p.price, p.original_price, p.category_id, p.stock, p.image_url, p.rating, p.num_reviews, p.is_featured, p.brand]
        );
      }

      // Insert demo orders if not present
      const [existingOrders] = await pool.query('SELECT COUNT(*) as count FROM `orders`');
      if (existingOrders[0].count === 0) {
        for (const ord of seed.demoOrders) {
          await pool.query(
            'INSERT IGNORE INTO orders (id, order_number, user_id, total_amount, shipping_fee, discount_amount, recipient_name, phone, shipping_address, city, state, postal_code, payment_method, payment_status, order_status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [ord.id, ord.order_number, ord.user_id, ord.total_amount, ord.shipping_fee, ord.discount_amount, ord.recipient_name, ord.phone, ord.shipping_address, ord.city, ord.state, ord.postal_code, ord.payment_method, ord.payment_status, ord.order_status, ord.notes, ord.created_at, ord.updated_at]
          );

          if (ord.items) {
            for (const item of ord.items) {
              await pool.query(
                'INSERT IGNORE INTO order_items (id, order_id, product_id, product_name, price, quantity, subtotal, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [item.id, ord.id, item.product_id, item.product_name, item.price, item.quantity, item.subtotal, item.image_url]
              );
            }
          }
        }
      }

      console.log('✅ MySQL Database seeded with 66+ products and complete categories.');
    }

    useFallback = false;
    console.log(`✅ [MySQL Connected] Database "${dbName}" is active and ready.`);
    return true;
  } catch (error) {
    console.warn('⚠️ [MySQL Connection Notice]:', error.message);
    console.log('ℹ️ Activating resilient In-Memory Store so the project runs immediately with complete functionality.');
    useFallback = true;
    await initMemoryStore();
    return false;
  }
}

// Generic Query function handling both MySQL and Fallback memory store seamlessly
async function query(sql, params = []) {
  if (!useFallback && pool) {
    try {
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (err) {
      console.error('MySQL Query Error:', err.message);
      throw err;
    }
  }

  // Handle in-memory query simulation if MySQL is offline
  return handleMemoryQuery(sql, params);
}

function handleMemoryQuery(sql, params) {
  const cleanSql = sql.trim().toLowerCase();

  // 1. SELECT queries
  if (cleanSql.startsWith('select')) {
    // Select from users
    if (cleanSql.includes('from users') || cleanSql.includes('from `users`')) {
      if (cleanSql.includes('where id =') || cleanSql.includes('where `id` =')) {
        const id = Number(params[0]);
        return memoryStore.users.filter(u => u.id === id);
      }
      if (cleanSql.includes('where email =') || cleanSql.includes('where `email` =')) {
        const email = String(params[0]).toLowerCase();
        return memoryStore.users.filter(u => u.email.toLowerCase() === email);
      }
      if (cleanSql.includes('count(*)')) {
        if (cleanSql.includes("where role = 'customer'")) {
          return [{ total_customers: memoryStore.users.filter(u => u.role === 'customer').length, count: memoryStore.users.filter(u => u.role === 'customer').length }];
        }
        return [{ count: memoryStore.users.length, total_customers: memoryStore.users.length }];
      }
      // Return users sorted by created_at desc
      return [...memoryStore.users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Select from categories
    if (cleanSql.includes('from categories') || cleanSql.includes('from `categories`')) {
      return [...memoryStore.categories];
    }

    // Select from products
    if (cleanSql.includes('from products') || cleanSql.includes('from `products`')) {
      if (cleanSql.includes('count(*)')) {
        return [{ total_products: memoryStore.products.length, count: memoryStore.products.length }];
      }

      let list = memoryStore.products.map(p => {
        const cat = memoryStore.categories.find(c => c.id === p.category_id);
        return { ...p, category_name: cat ? cat.name : 'Uncategorized' };
      });

      if (cleanSql.includes('where p.id =') || cleanSql.includes('where id =')) {
        const id = Number(params[0]);
        return list.filter(p => p.id === id);
      }

      if (cleanSql.includes('is_featured = 1') || cleanSql.includes('is_featured = true')) {
        return list.filter(p => p.is_featured);
      }

      return list;
    }

    // Select from cart_items
    if (cleanSql.includes('from cart_items') || cleanSql.includes('from `cart_items`')) {
      const userId = Number(params[0]);
      const userItems = memoryStore.cart_items.filter(c => c.user_id === userId);
      return userItems.map(item => {
        const product = memoryStore.products.find(p => p.id === item.product_id) || {};
        return {
          id: item.id,
          user_id: item.user_id,
          product_id: item.product_id,
          quantity: item.quantity,
          name: product.name || 'Unknown Product',
          price: product.price || 0,
          original_price: product.original_price || 0,
          image_url: product.image_url || '',
          stock: product.stock || 0
        };
      });
    }

    // Select from orders
    if (cleanSql.includes('from orders') || cleanSql.includes('from `orders`')) {
      if (cleanSql.includes('sum(total_amount)') || cleanSql.includes('total_revenue')) {
        const totalRev = memoryStore.orders
          .filter(o => o.order_status !== 'Cancelled')
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        return [{ total_revenue: totalRev, 'SUM(total_amount)': totalRev }];
      }
      if (cleanSql.includes('where user_id =') || cleanSql.includes('where `user_id` =')) {
        const userId = Number(params[0]);
        const ords = memoryStore.orders
          .filter(o => o.user_id === userId)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return ords;
      }
      if (cleanSql.includes('where id =') || cleanSql.includes('where o.id =')) {
        const id = Number(params[0]);
        return memoryStore.orders.filter(o => o.id === id);
      }
      if (cleanSql.includes('where order_number =')) {
        const num = String(params[0]);
        return memoryStore.orders.filter(o => o.order_number === num);
      }
      if (cleanSql.includes('count(*)')) {
        return [{ count: memoryStore.orders.length, total_orders: memoryStore.orders.length }];
      }
      return [...memoryStore.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Select from order_items
    if (cleanSql.includes('from order_items') || cleanSql.includes('from `order_items`')) {
      const orderId = Number(params[0]);
      return memoryStore.order_items.filter(oi => oi.order_id === orderId);
    }

    // Select from reviews
    if (cleanSql.includes('from reviews') || cleanSql.includes('from `reviews`')) {
      const prodId = Number(params[0]);
      return memoryStore.reviews.filter(r => r.product_id === prodId);
    }

    // Select from notifications
    if (cleanSql.includes('from notifications') || cleanSql.includes('from `notifications`')) {
      const userId = Number(params[0]);
      return memoryStore.notifications
        .filter(n => n.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Admin revenue calculation
    if (cleanSql.includes('sum(total_amount)') || cleanSql.includes('sum(`total_amount`)') || cleanSql.includes('total_revenue')) {
      const totalRev = memoryStore.orders
        .filter(o => o.order_status !== 'Cancelled')
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      return [{ total_revenue: totalRev, 'SUM(total_amount)': totalRev }];
    }
  }

  // 2. INSERT queries
  if (cleanSql.startsWith('insert into users')) {
    const newUser = {
      id: memoryStore.nextIds.users++,
      name: params[0],
      email: params[1],
      password: params[2],
      role: params[3] || 'customer',
      phone: params[4] || null,
      address: params[5] || null,
      city: params[6] || null,
      state: params[7] || null,
      postal_code: params[8] || null,
      created_at: new Date()
    };
    memoryStore.users.push(newUser);
    return { insertId: newUser.id, affectedRows: 1 };
  }

  if (cleanSql.startsWith('insert into products')) {
    const newProd = {
      id: memoryStore.nextIds.products++,
      name: params[0],
      description: params[1],
      price: Number(params[2]),
      original_price: params[3] ? Number(params[3]) : null,
      category_id: Number(params[4]),
      stock: Number(params[5]),
      image_url: params[6],
      brand: params[7] || 'Store Brand',
      is_featured: params[8] ? 1 : 0,
      rating: 5.0,
      num_reviews: 0,
      created_at: new Date()
    };
    memoryStore.products.push(newProd);
    return { insertId: newProd.id, affectedRows: 1 };
  }

  if (cleanSql.startsWith('insert into cart_items')) {
    const userId = Number(params[0]);
    const productId = Number(params[1]);
    const quantity = Number(params[2]);

    const existingIndex = memoryStore.cart_items.findIndex(c => c.user_id === userId && c.product_id === productId);
    if (existingIndex >= 0) {
      memoryStore.cart_items[existingIndex].quantity += quantity;
      return { insertId: memoryStore.cart_items[existingIndex].id, affectedRows: 1 };
    } else {
      const newCartItem = {
        id: memoryStore.nextIds.cart_items++,
        user_id: userId,
        product_id: productId,
        quantity: quantity,
        created_at: new Date()
      };
      memoryStore.cart_items.push(newCartItem);
      return { insertId: newCartItem.id, affectedRows: 1 };
    }
  }

  if (cleanSql.startsWith('insert into orders')) {
    const newOrder = {
      id: memoryStore.nextIds.orders++,
      order_number: params[0],
      user_id: Number(params[1]),
      total_amount: Number(params[2]),
      shipping_fee: Number(params[3] || 0),
      discount_amount: Number(params[4] || 0),
      recipient_name: params[5],
      phone: params[6],
      shipping_address: params[7],
      city: params[8],
      state: params[9],
      postal_code: params[10],
      payment_method: params[11],
      payment_status: params[12] || 'Pending',
      order_status: params[13] || 'Placed',
      notes: params[14] || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryStore.orders.push(newOrder);
    return { insertId: newOrder.id, affectedRows: 1 };
  }

  if (cleanSql.startsWith('insert into order_items')) {
    const newItem = {
      id: memoryStore.nextIds.order_items++,
      order_id: Number(params[0]),
      product_id: Number(params[1]),
      product_name: params[2],
      price: Number(params[3]),
      quantity: Number(params[4]),
      subtotal: Number(params[5]),
      image_url: params[6]
    };
    memoryStore.order_items.push(newItem);
    return { insertId: newItem.id, affectedRows: 1 };
  }

  if (cleanSql.startsWith('insert into reviews')) {
    const newRev = {
      id: memoryStore.nextIds.reviews++,
      product_id: Number(params[0]),
      user_id: Number(params[1]),
      user_name: params[2],
      rating: Number(params[3]),
      comment: params[4],
      created_at: new Date()
    };
    memoryStore.reviews.push(newRev);

    // Update product average rating
    const prodReviews = memoryStore.reviews.filter(r => r.product_id === newRev.product_id);
    const avgRating = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
    const prod = memoryStore.products.find(p => p.id === newRev.product_id);
    if (prod) {
      prod.rating = Number(avgRating.toFixed(2));
      prod.num_reviews = prodReviews.length;
    }

    return { insertId: newRev.id, affectedRows: 1 };
  }

  if (cleanSql.startsWith('insert into notifications')) {
    const newNotif = {
      id: memoryStore.nextIds.notifications++,
      user_id: Number(params[0]),
      order_id: params[1] ? Number(params[1]) : null,
      title: params[2],
      message: params[3],
      type: params[4] || 'order_update',
      is_read: false,
      created_at: new Date()
    };
    memoryStore.notifications.push(newNotif);
    return { insertId: newNotif.id, affectedRows: 1 };
  }

  // 3. UPDATE queries
  if (cleanSql.startsWith('update notifications set is_read')) {
    if (cleanSql.includes('where id =') && cleanSql.includes('and user_id =')) {
      const id = Number(params[0]);
      const userId = Number(params[1]);
      const notif = memoryStore.notifications.find(n => n.id === id && n.user_id === userId);
      if (notif) notif.is_read = true;
      return { affectedRows: 1 };
    }
    if (cleanSql.includes('where user_id =')) {
      const userId = Number(params[0]);
      memoryStore.notifications.forEach(n => {
        if (n.user_id === userId) n.is_read = true;
      });
      return { affectedRows: 1 };
    }
  }
  if (cleanSql.startsWith('update users')) {
    const userId = Number(params[params.length - 1]);
    const userIndex = memoryStore.users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      // params: [name, avatar_url, phone, address, city, state, postal_code, userId]
      if (params[0] !== null && params[0] !== undefined) memoryStore.users[userIndex].name = params[0];
      if (params[1] !== null && params[1] !== undefined) memoryStore.users[userIndex].avatar_url = params[1];
      if (params[2] !== null && params[2] !== undefined) memoryStore.users[userIndex].phone = params[2];
      if (params[3] !== null && params[3] !== undefined) memoryStore.users[userIndex].address = params[3];
      if (params[4] !== null && params[4] !== undefined) memoryStore.users[userIndex].city = params[4];
      if (params[5] !== null && params[5] !== undefined) memoryStore.users[userIndex].state = params[5];
      if (params[6] !== null && params[6] !== undefined) memoryStore.users[userIndex].postal_code = params[6];
      return { affectedRows: 1 };
    }
  }

  if (cleanSql.startsWith('update products')) {
    const id = Number(params[params.length - 1]);
    const prodIndex = memoryStore.products.findIndex(p => p.id === id);
    if (prodIndex >= 0) {
      memoryStore.products[prodIndex] = {
        ...memoryStore.products[prodIndex],
        name: params[0],
        description: params[1],
        price: Number(params[2]),
        original_price: params[3] ? Number(params[3]) : null,
        category_id: Number(params[4]),
        stock: Number(params[5]),
        image_url: params[6],
        brand: params[7] || memoryStore.products[prodIndex].brand,
        is_featured: params[8] ? 1 : 0
      };
      return { affectedRows: 1 };
    }
  }

  if (cleanSql.startsWith('update cart_items')) {
    const qty = Number(params[0]);
    const cartId = Number(params[1]);
    const userId = Number(params[2]);
    const item = memoryStore.cart_items.find(c => c.id === cartId && c.user_id === userId);
    if (item) {
      item.quantity = qty;
      return { affectedRows: 1 };
    }
  }

  if (cleanSql.startsWith('update orders set order_status')) {
    const status = params[0];
    const id = Number(params[1]);
    const ord = memoryStore.orders.find(o => o.id === id);
    if (ord) {
      ord.order_status = status;
      ord.updated_at = new Date();
      return { affectedRows: 1 };
    }
  }

  // 4. DELETE queries
  if (cleanSql.startsWith('delete from cart_items')) {
    if (cleanSql.includes('where user_id =') && cleanSql.includes('and id =')) {
      const userId = Number(params[0]);
      const id = Number(params[1]);
      memoryStore.cart_items = memoryStore.cart_items.filter(c => !(c.user_id === userId && c.id === id));
      return { affectedRows: 1 };
    }
    if (cleanSql.includes('where user_id =')) {
      const userId = Number(params[0]);
      memoryStore.cart_items = memoryStore.cart_items.filter(c => c.user_id !== userId);
      return { affectedRows: 1 };
    }
  }

  if (cleanSql.startsWith('delete from products')) {
    const id = Number(params[0]);
    memoryStore.products = memoryStore.products.filter(p => p.id !== id);
    return { affectedRows: 1 };
  }

  return [];
}

function getDatabaseStatus() {
  return {
    isMySQL: !useFallback,
    mode: useFallback ? 'In-Memory Fallback Store (No MySQL server required)' : 'Live MySQL Database',
    database: process.env.DB_NAME || 'ecommerce_db',
    host: process.env.DB_HOST || 'localhost'
  };
}

module.exports = {
  initMySQL,
  query,
  getDatabaseStatus,
  memoryStore
};
