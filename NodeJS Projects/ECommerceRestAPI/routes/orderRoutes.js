const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.post('/', verifyToken, orderController.createOrder);
router.get('/', verifyToken, orderController.getUserOrders);
router.get('/:id', verifyToken, orderController.getOrderById);
router.put('/:id/status', verifyToken, isAdmin, orderController.updateOrderStatus);
router.post('/:id/cancel', verifyToken, orderController.cancelOrder);

module.exports = router;
