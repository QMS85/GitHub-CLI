const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
exports.register = async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: '❌ Validation error',
        errors: error.details.map(d => d.message)
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(400).json({ message: '❌ Email already registered' });
    }

    // Create new user
    const user = new User({
      name: value.name,
      email: value.email,
      password: value.password,
      phone: value.phone
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: '✅ User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Registration failed', error: error.message });
  }
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
exports.login = async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: '❌ Validation error',
        errors: error.details.map(d => d.message)
      });
    }

    // Find user by email
    const user = await User.findOne({ email: value.email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: '❌ Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(value.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '❌ Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: '✅ Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Login failed', error: error.message });
  }
};

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    res.status(200).json({
      message: '✅ Profile retrieved successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to retrieve profile', error: error.message });
  }
};

// @route   PUT /api/auth/profile/:id
// @desc    Update user profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        phone,
        address,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    res.status(200).json({
      message: '✅ Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to update profile', error: error.message });
  }
};
