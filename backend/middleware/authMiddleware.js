const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_ecommerce_major_project_2026';

// Middleware to verify JWT token
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user data from database
    const users = await query('SELECT id, name, email, role, avatar_url, phone, address, city, state, postal_code FROM users WHERE id = ?', [decoded.id]);
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'User account no longer exists.' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Authentication failed. Invalid token.' });
  }
}

// Optional Auth (e.g. For browsing products or viewing carts if guest/logged-in)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        const users = await query('SELECT id, name, email, role, avatar_url FROM users WHERE id = ?', [decoded.id]);
        if (users && users.length > 0) {
          req.user = users[0];
        }
      }
    }
  } catch (err) {
    // Ignore invalid tokens for optional routes
  }
  next();
}

// Staff & Admin middleware (Allows Admins and Delivery Agents)
function requireStaffOrAdmin(req, res, next) {
  const role = req.user && req.user.role ? String(req.user.role).toLowerCase() : '';
  if (role !== 'admin' && role !== 'administrator' && role !== 'delivery_agent' && role !== 'staff') {
    return res.status(403).json({ success: false, message: 'Access denied. Management or logistics staff privileges required.' });
  }
  next();
}

// Admin only middleware
function requireAdmin(req, res, next) {
  const role = req.user && req.user.role ? String(req.user.role).toLowerCase() : '';
  if (role !== 'admin' && role !== 'administrator') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
}

module.exports = {
  verifyToken,
  optionalAuth,
  requireStaffOrAdmin,
  requireAdmin,
  JWT_SECRET
};
