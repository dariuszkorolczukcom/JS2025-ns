import express from 'express';
const router = express.Router();
import reviewController from '../controllers/reviewController';
import { isAuthenticated } from '../config/passport';
import { checkPermission } from '../middleware/authMiddleware';

// GET /api/reviews - Get all reviews (ADMIN i EDITOR)
router.get('/', isAuthenticated, checkPermission('reviews:read'), reviewController.getAllReviews);

// GET /api/reviews/:id - Get review by ID (ADMIN i EDITOR)
router.get('/:id', isAuthenticated, checkPermission('reviews:read'), reviewController.getReviewById);

// POST /api/reviews - Create new review (ADMIN i EDITOR)
router.post('/', isAuthenticated, checkPermission('reviews:create'), reviewController.createReview);

// PUT /api/reviews/:id - Update review (ADMIN i EDITOR)
router.put('/:id', isAuthenticated, checkPermission('reviews:update'), reviewController.updateReview);

// PATCH /api/reviews/:id - Update review (partial) (ADMIN i EDITOR)
router.patch('/:id', isAuthenticated, checkPermission('reviews:update'), reviewController.updateReview);

// DELETE /api/reviews/:id - Delete review (ADMIN i EDITOR)
router.delete('/:id', isAuthenticated, checkPermission('reviews:delete'), reviewController.deleteReview);

export default router;

