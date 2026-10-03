const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { initMySQL, getDatabaseStatus } = require('./backend/config/db');
const authRoutes = require('./backend/routes/authRoutes');
const productRoutes = require('./backend/routes/productRoutes');
const cartRoutes = require('./backend/routes/cartRoutes');
const orderRoutes = require('./backend/routes/orderRoutes');
const adminRoutes = require('./backend/routes/adminRoutes');
const notificationRoutes = require('./backend/routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);


// Database Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: getDatabaseStatus()
  });
});

// Fallback for SPA/HTML routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API Endpoint not found.' });
  }
  // If file doesn't have an extension, try sending .html
  if (!path.extname(req.path)) {
    const htmlFile = path.join(__dirname, 'public', `${req.path.replace(/^\//, '')}.html`);
    return res.sendFile(htmlFile, (err) => {
      if (err) res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }
  next();
});

// Start Server & Initialize Database with Auto-Port Fallback
async function startServer(portToUse = PORT) {
  if (portToUse === PORT) {
    await initMySQL();
  }

  const server = app.listen(portToUse, () => {
    console.log('========================================================');
    console.log(`🚀 E-Commerce Server running at: http://localhost:${portToUse}`);
    console.log(`🛒 Customer Storefront:          http://localhost:${portToUse}/index.html`);
    console.log(`👤 Customer Login / Register:    http://localhost:${portToUse}/login.html`);
    console.log(`⚙️  Admin Portal Login:           http://localhost:${portToUse}/admin-login.html`);
    console.log(`📊 Admin Dashboard:              http://localhost:${portToUse}/admin.html`);
    console.log('--------------------------------------------------------');
    console.log(`🔑 Demo Admin Login:  admin@ecommerce.com  /  admin123`);
    console.log(`🔑 Demo User Login:   john@example.com   /  customer123`);
    console.log('========================================================');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(portToUse) + 1;
      console.warn(`⚠️  Port ${portToUse} is in use by a previous instance. Automatically switching to http://localhost:${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('Server error:', err);
    }
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
