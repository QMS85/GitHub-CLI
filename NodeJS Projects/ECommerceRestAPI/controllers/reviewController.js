const Review = require('../models/Review');
const Product = require('../models/Product');
const Joi = require('joi');

const reviewSchema = Joi.object({
  productId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().min(5).max(100).required(),
  comment: Joi.string().min(10).required()
});

// @route   POST /api/reviews
// @desc    Create product review
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { error, value } = reviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: '❌ Validation error',
        errors: error.details.map(d => d.message)
      });
    }

    // Check if product exists
    const product = await Product.findById(value.productId);
    if (!product) {
      return res.status(404).json({ message: '❌ Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: value.productId,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({ message: '❌ You have already reviewed this product' });
    }

    // Create review
    const review = new Review({
      product: value.productId,
      user: req.user.id,
      rating: value.rating,
      title: value.title,
      comment: value.comment
    });

    await review.save();
    await review.populate('user', 'name email');

    // Add review to product
    product.reviews.push(review._id);

    // Calculate average rating
    const reviews = await Review.find({ product: value.productId });
    const avgRating = reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length;
    product.rating = avgRating;

    await product.save();

    res.status(201).json({
      message: '✅ Review created successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to create review', error: error.message });
  }
};

// @route   GET /api/reviews/:productId
// @desc    Get all reviews for a product
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name email')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments({ product: req.params.productId });

    res.status(200).json({
      message: '✅ Reviews retrieved successfully',
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      reviews
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to retrieve reviews', error: error.message });
  }
};

// @route   PUT /api/reviews/:id
// @desc    Update review
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: '❌ Review not found' });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: '❌ You can only edit your own reviews' });
    }

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.updatedAt = Date.now();

    await review.save();
    await review.populate('user', 'name email');

    // Recalculate product rating
    const reviews = await Review.find({ product: review.product });
    const avgRating = reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(review.product, { rating: avgRating });

    res.status(200).json({
      message: '✅ Review updated successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to update review', error: error.message });
  }
};

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: '❌ Review not found' });
    }

    // Check if user owns the review or is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '❌ You cannot delete this review' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    // Remove review from product
    await Product.findByIdAndUpdate(
      productId,
      { $pull: { reviews: req.params.id } }
    );

    // Recalculate product rating
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length 
      : 0;
    await Product.findByIdAndUpdate(productId, { rating: avgRating });

    res.status(200).json({
      message: '✅ Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to delete review', error: error.message });
  }
};

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
exports.markReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpful: 1 } },
      { new: true }
    ).populate('user', 'name email');

    res.status(200).json({
      message: '✅ Review marked as helpful',
      review
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Failed to mark review as helpful', error: error.message });
  }
};
