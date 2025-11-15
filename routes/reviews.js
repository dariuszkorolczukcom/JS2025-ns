const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// GET /api/reviews - Get all reviews
router.get('/', reviewController.getAllReviews);

// GET /api/reviews/:id - Get review by ID
router.get('/:id', reviewController.getReviewById);

// POST /api/reviews - Create new review
router.post('/', reviewController.createReview);

module.exports = router;

