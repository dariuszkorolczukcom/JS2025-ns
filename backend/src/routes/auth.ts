import { Router } from 'express';
import { loginUser, registerUser, profile } from '../controllers/authController';
import { isAuthenticated } from '../config/passport';

const router = Router();

/**
 * POST /api/auth/register
 * Rejestracja nowego użytkownika
 * Body: { email, password, username, first_name?, last_name? }
 * Returns: { token, user }
 */
router.post('/register', registerUser);

/**
 * POST /api/auth/login
 * Logowanie użytkownika
 * Body: { email, password }
 * Returns: { token }
 */
router.post('/login', loginUser);

/**
 * GET /api/auth/profile
 * Pobranie profilu zalogowanego użytkownika
 * Requires: Authentication (Bearer token)
 * Returns: { user }
 */
router.get('/profile', isAuthenticated, profile);

export default router;
