import { Router } from 'express';
import usersRoutes from './users';
import musicRoutes from './music';
import reviewsRoutes from './reviews';
import authRoutes from './auth';


import { index, healthCheck } from '../controllers/commonController';

const router = Router();
router.use('/users', usersRoutes);
router.use('/music', musicRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/auth', authRoutes);
router.get('/health', healthCheck);
router.get('/', index);

export default router;

