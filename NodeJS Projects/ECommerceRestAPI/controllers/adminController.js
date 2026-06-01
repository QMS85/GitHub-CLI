const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private/Admin
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalReviews = await Review.countDocuments();

    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const orderStatusBreakdown = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      message: '✅ Dashboard data retrieved successfully',
      statistics: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalReviews,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders,
      orderStatusBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to retrieve dashboard', error: error.message });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.status(200).json({
      message: '✅ Users retrieved successfully',
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to retrieve users', error: error.message });
  }
};

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: '❌ Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, updatedAt: Date.now() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    res.status(200).json({
      message: '✅ User role updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to update user role', error: error.message });
  }
};

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    res.status(200).json({
      message: '✅ User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to delete user', error: error.message });
  }
};

// @route   GET /api/admin/orders
// @desc    Get all orders with filters
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

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

// @route   GET /api/admin/sales-analytics
// @desc    Get sales analytics
// @access  Private/Admin
exports.getSalesAnalytics = async (req, res) => {
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      }
    ]);

    res.status(200).json({
      message: '✅ Sales analytics retrieved successfully',
      dailySales,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to retrieve sales analytics', error: error.message });
  }
};
