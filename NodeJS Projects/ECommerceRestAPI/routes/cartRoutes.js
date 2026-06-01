const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, cartController.getCart);
router.post('/add', verifyToken, cartController.addToCart);
router.put('/update/:itemId', verifyToken, cartController.updateCartItem);
router.delete('/remove/:itemId', verifyToken, cartController.removeFromCart);
router.delete('/clear', verifyToken, cartController.clearCart);

module.exports = router;
