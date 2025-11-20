import express from 'express';
const router = express.Router();
import reviewController from '../controllers/reviewController.js';

// GET /api/reviews - Get all reviews
router.get('/', reviewController.getAllReviews);

// GET /api/reviews/:id - Get review by ID
router.get('/:id', reviewController.getReviewById);

// POST /api/reviews - Create new review
router.post('/', reviewController.createReview);

export default router;

