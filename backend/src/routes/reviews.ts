import express from 'express';
const router = express.Router();
import reviewController from '../controllers/reviewController';
import { isAuthenticated } from '../config/passport';
import { checkPermission } from '../middleware/authMiddleware';

// GET /api/reviews - Get all reviews
router.get('/', isAuthenticated, checkPermission('reviews:read'), reviewController.getAllReviews);

// GET /api/reviews/:id - Get review by ID
router.get('/:id', isAuthenticated, checkPermission('reviews:read'), reviewController.getReviewById);

// POST /api/reviews - Create new review
router.post('/', isAuthenticated, checkPermission('reviews:create'), reviewController.createReview);

export default router;

