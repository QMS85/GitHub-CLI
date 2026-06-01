const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.post('/', verifyToken, reviewController.createReview);
router.get('/:productId', reviewController.getProductReviews);
router.put('/:id', verifyToken, reviewController.updateReview);
router.delete('/:id', verifyToken, reviewController.deleteReview);
router.post('/:id/helpful', verifyToken, reviewController.markReviewHelpful);

module.exports = router;
