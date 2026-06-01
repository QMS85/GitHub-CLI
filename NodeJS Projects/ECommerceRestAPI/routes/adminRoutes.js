const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/dashboard', verifyToken, isAdmin, adminController.getDashboard);
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);
router.put('/users/:id/role', verifyToken, isAdmin, adminController.updateUserRole);
router.delete('/users/:id', verifyToken, isAdmin, adminController.deleteUser);
router.get('/orders', verifyToken, isAdmin, adminController.getAllOrders);
router.get('/sales-analytics', verifyToken, isAdmin, adminController.getSalesAnalytics);

module.exports = router;
