const Product = require('../models/Product');
const Joi = require('joi');

const productSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('Electronics', 'Clothing', 'Books', 'Food', 'Home', 'Sports', 'Other').required(),
  stock: Joi.number().min(0).required(),
  image: Joi.string().optional()
});

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, minPrice, maxPrice, search } = req.query;

    let filter = {};

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Search by name or description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(filter)
      .populate('reviews')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      message: '✅ Products retrieved successfully',
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to retrieve products', error: error.message });
  }
};

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews');

    if (!product) {
      return res.status(404).json({ message: '❌ Product not found' });
    }

    res.status(200).json({
      message: '✅ Product retrieved successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to retrieve product', error: error.message });
  }
};

// @route   POST /api/products
// @desc    Create new product (Admin only)
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: '❌ Validation error',
        errors: error.details.map(d => d.message)
      });
    }

    const product = new Product({
      ...value,
      createdBy: req.user.id
    });

    await product.save();

    res.status(201).json({
      message: '✅ Product created successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to create product', error: error.message });
  }
};

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { error, value } = productSchema.validate(req.body, { presence: 'optional' });
    if (error) {
      return res.status(400).json({ 
        message: '❌ Validation error',
        errors: error.details.map(d => d.message)
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...value, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: '❌ Product not found' });
    }

    res.status(200).json({
      message: '✅ Product updated successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to update product', error: error.message });
  }
};

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: '❌ Product not found' });
    }

    res.status(200).json({
      message: '✅ Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to delete product', error: error.message });
  }
};
