import { Router } from 'express';
import { loginUser, registerUser, profile, updateProfile, changePassword } from '../controllers/authController';
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

/**
 * PUT /api/auth/profile
 * Aktualizacja profilu zalogowanego użytkownika
 * Requires: Authentication (Bearer token)
 * Body: { username?, email?, first_name?, last_name? }
 * Returns: { user }
 */
router.put('/profile', isAuthenticated, updateProfile);

/**
 * PATCH /api/auth/profile
 * Aktualizacja profilu zalogowanego użytkownika (partial)
 * Requires: Authentication (Bearer token)
 * Body: { username?, email?, first_name?, last_name? }
 * Returns: { user }
 */
router.patch('/profile', isAuthenticated, updateProfile);

/**
 * POST /api/auth/change-password
 * Zmiana hasła zalogowanego użytkownika
 * Requires: Authentication (Bearer token)
 * Body: { oldPassword, newPassword }
 * Returns: { message }
 */
router.post('/change-password', isAuthenticated, changePassword);

export default router;
