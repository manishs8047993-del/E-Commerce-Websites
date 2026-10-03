const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin, requireStaffOrAdmin } = require('../middleware/authMiddleware');

// All management routes require valid token
router.use(verifyToken);

// ==================== SHARED MANAGEMENT & LOGISTICS ROUTES ====================
// Dashboard Statistics Overview
router.get('/stats', requireStaffOrAdmin, adminController.getStats);

// Order Management (View orders, update status)
router.get('/orders', requireStaffOrAdmin, adminController.getOrders);
router.put('/orders/:id/status', requireStaffOrAdmin, adminController.updateOrderStatus);

// Customer & Delivery Addresses Directory
router.get('/customers', requireStaffOrAdmin, adminController.getCustomers);

// Category reading
router.get('/categories', requireStaffOrAdmin, adminController.getCategories);

// ==================== STRICTLY ADMINISTRATOR ONLY ROUTES ====================
// Category Management
router.post('/categories', requireAdmin, adminController.addCategory);
router.delete('/categories/:id', requireAdmin, adminController.deleteCategory);

// View Payments & Revenue Ledger
router.get('/payments', requireAdmin, adminController.getPayments);

// Generate Financial Reports
router.get('/reports', requireAdmin, adminController.getReports);

// Product Inventory Management
router.post('/products', requireAdmin, adminController.addProduct);
router.put('/products/:id', requireAdmin, adminController.updateProduct);
router.delete('/products/:id', requireAdmin, adminController.deleteProduct);

// Staff & Role Management (Admin Only)
router.get('/staff', requireAdmin, adminController.getStaff);
router.post('/staff', requireAdmin, adminController.addStaff);
router.put('/staff/:id', requireAdmin, adminController.updateStaff);
router.delete('/staff/:id', requireAdmin, adminController.deleteStaff);
router.put('/orders/:orderId/assign-delivery', requireAdmin, adminController.assignDeliveryAgent);

module.exports = router;
