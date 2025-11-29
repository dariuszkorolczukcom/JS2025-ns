import express from 'express';
const router = express.Router();
import userController from '../controllers/userController';
import { isAuthenticated } from '../config/passport';
import { checkPermission } from '../middleware/authMiddleware';

// GET /api/users - Get all users
router.get('/', isAuthenticated, checkPermission('users:read'), userController.getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', isAuthenticated, checkPermission('users:read'), userController.getUserById);

// POST /api/users - Create new user
router.post('/', isAuthenticated, checkPermission('users:create'), userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', isAuthenticated, checkPermission('users:update'), userController.updateUser);

// PATCH /api/users/:id - Update user (partial)
router.patch('/:id', isAuthenticated, checkPermission('users:update'), userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', isAuthenticated, checkPermission('users:delete'), userController.deleteUser);

export default router;

