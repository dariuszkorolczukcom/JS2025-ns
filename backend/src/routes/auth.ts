import { Router } from 'express';
import { loginUser } from '../controllers/authController';
import { isAuthenticated } from '../config/passport';
import { profile } from '../controllers/commonController';

const router = Router();

router.post('/login', loginUser);
router.get('/profile', isAuthenticated, profile);

export default router;
