import { Router } from 'express';
import usersRoutes from './users';
import musicRoutes from './music';
import reviewsRoutes from './reviews';
import authRoutes from './auth';


import { index } from '../controllers/commonController';
import { checkPermission } from '../middleware/authMiddleware';

const router = Router();
router.use('/users',checkPermission('users:read'), usersRoutes);
router.use('/music',checkPermission('music:read'), musicRoutes);
router.use('/reviews',checkPermission('reviews:read'), reviewsRoutes);
router.use('/auth', authRoutes);
router.get('/', index);

export default router;

