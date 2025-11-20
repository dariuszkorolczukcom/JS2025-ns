import { Router } from 'express';

import usersRoutes from './users';
import musicRoutes from './music';
import reviewsRoutes from './reviews';
import authRoutes from './auth';

const router = Router();
router.use('/users', usersRoutes);
router.use('/music', musicRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/auth', authRoutes);
router.get('/', (req: any, res: any) => {
    res.json({ 
        message: 'MusicWeb API is running',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            music: '/api/music',
            reviews: '/api/reviews',
            auth: '/api/auth'
        }
    });
});

export default router;

