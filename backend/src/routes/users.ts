import express from 'express';
const router = express.Router();
import userController from '../controllers/userController';
import { isAuthenticated } from '../config/passport';
import { requireAdmin } from '../middleware/authMiddleware';

// GET /api/users - Get all users (tylko ADMIN)
router.get('/', isAuthenticated, requireAdmin, userController.getAllUsers);

// GET /api/users/:id - Get user by ID (tylko ADMIN)
router.get('/:id', isAuthenticated, requireAdmin, userController.getUserById);

// POST /api/users - Create new user (tylko ADMIN)
router.post('/', isAuthenticated, requireAdmin, userController.createUser);

// PUT /api/users/:id - Update user (tylko ADMIN)
router.put('/:id', isAuthenticated, requireAdmin, userController.updateUser);

// PATCH /api/users/:id - Update user (partial) (tylko ADMIN)
router.patch('/:id', isAuthenticated, requireAdmin, userController.updateUser);

// DELETE /api/users/:id - Delete user (tylko ADMIN)
router.delete('/:id', isAuthenticated, requireAdmin, userController.deleteUser);

export default router;

