const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Joi = require('joi');

const createOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required()
  }).required(),
  paymentMethod: Joi.string().valid('credit_card', 'debit_card', 'paypal', 'stripe').required()
});

// @route   POST /api/orders
// @desc    Create order from cart
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: '❌ Validation error',
        errors: error.details.map(d => d.message)
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: '❌ Cart is empty' });
    }

    // Verify stock for all items
    for (let item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `❌ Insufficient stock for ${product.name}` 
        });
      }
    }

    // Create order
    const order = new Order({
      user: req.user.id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: cart.totalPrice,
      shippingAddress: value.shippingAddress,
      paymentMethod: value.paymentMethod,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Reduce product stock
    for (let item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    await order.save();
    await order.populate('items.product');

    // Clear cart
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], totalPrice: 0 }
    );

    res.status(201).json({
      message: '✅ Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to create order', error: error.message });
  }
};

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
exports.getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments({ user: req.user.id });

    res.status(200).json({
      message: '✅ Orders retrieved successfully',
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      orders
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to retrieve orders', error: error.message });
  }
};

// @route   GET /api/orders/:id
// @desc    Get order details
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');

    if (!order) {
      return res.status(404).json({ message: '❌ Order not found' });
    }

    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '❌ You do not have permission to view this order' });
    }

    res.status(200).json({
      message: '✅ Order retrieved successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to retrieve order', error: error.message });
  }
};

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (orderStatus && !validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: '❌ Invalid order status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        orderStatus: orderStatus || undefined,
        paymentStatus: paymentStatus || undefined,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('items.product');

    if (!order) {
      return res.status(404).json({ message: '❌ Order not found' });
    }

    res.status(200).json({
      message: '✅ Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to update order status', error: error.message });
  }
};

// @route   POST /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '❌ Order not found' });
    }

    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '❌ You do not have permission to cancel this order' });
    }

    // Can only cancel pending orders
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ message: '❌ Cannot cancel a confirmed or shipped order' });
    }

    // Restore product stock
    for (let item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    order.orderStatus = 'cancelled';
    await order.save();

    res.status(200).json({
      message: '✅ Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to cancel order', error: error.message });
  }
};
