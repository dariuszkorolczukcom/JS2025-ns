import express from 'express';
import musicController from '../controllers/musicController';
import { isAuthenticated } from '../config/passport';
import { checkPermission } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/music - Get all music entries
router.get('/', musicController.getAllMusic);

// GET /api/music/genres - Get all genres
router.get('/genres', musicController.getGenres);

// GET /api/music/:id - Get music by ID
router.get('/:id', musicController.getMusicById);

// POST /api/music - Create new music entry
router.post('/', isAuthenticated, checkPermission('music:create'), musicController.createMusic);

// PUT /api/music/:id - Update music entry
router.put('/:id', isAuthenticated, checkPermission('music:update'), musicController.updateMusic);

// PATCH /api/music/:id - Update music entry (partial)
router.patch('/:id', isAuthenticated, checkPermission('music:update'), musicController.updateMusic);

// DELETE /api/music/:id - Delete music entry
router.delete('/:id', isAuthenticated, checkPermission('music:delete'), musicController.deleteMusic);

export default router;

