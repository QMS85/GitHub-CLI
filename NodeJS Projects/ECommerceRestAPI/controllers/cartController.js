const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Joi = require('joi');

const addToCartSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().min(1).required()
});

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (!cart) {
      // Create new cart if doesn't exist
      cart = new Cart({ user: req.user.id, items: [] });
      await cart.save();
    }

    res.status(200).json({
      message: '✅ Cart retrieved successfully',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to retrieve cart', error: error.message });
  }
};

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { error, value } = addToCartSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: '❌ Validation error',
        errors: error.details.map(d => d.message)
      });
    }

    // Verify product exists
    const product = await Product.findById(value.productId);
    if (!product) {
      return res.status(404).json({ message: '❌ Product not found' });
    }

    // Check stock
    if (product.stock < value.quantity) {
      return res.status(400).json({ message: '❌ Insufficient stock available' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [{
          product: value.productId,
          quantity: value.quantity,
          price: product.price
        }]
      });
    } else {
      // Check if product already in cart
      const existingItem = cart.items.find(item => item.product.toString() === value.productId);

      if (existingItem) {
        existingItem.quantity += value.quantity;
      } else {
        cart.items.push({
          product: value.productId,
          quantity: value.quantity,
          price: product.price
        });
      }
    }

    await cart.save();
    cart = await cart.populate('items.product');

    res.status(200).json({
      message: '✅ Item added to cart successfully',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to add item to cart', error: error.message });
  }
};

// @route   PUT /api/cart/update/:itemId
// @desc    Update cart item quantity
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: '❌ Invalid quantity' });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: '❌ Cart not found' });
    }

    const item = cart.items.find(item => item._id.toString() === req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: '❌ Item not found in cart' });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      message: '✅ Cart item updated successfully',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to update cart item', error: error.message });
  }
};

// @route   DELETE /api/cart/remove/:itemId
// @desc    Remove item from cart
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: '❌ Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      message: '✅ Item removed from cart successfully',
      cart
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to remove item from cart', error: error.message });
  }
};

// @route   DELETE /api/cart/clear
// @desc    Clear cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], totalPrice: 0 }
    );

    res.status(200).json({
      message: '✅ Cart cleared successfully'
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to clear cart', error: error.message });
  }
};
