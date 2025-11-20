import express from 'express';
import musicController from '../controllers/musicController.js';
const router = express.Router();

// GET /api/music - Get all music entries
router.get('/', musicController.getAllMusic);

// GET /api/music/:id - Get music by ID
router.get('/:id', musicController.getMusicById);

// POST /api/music - Create new music entry
router.post('/', musicController.createMusic);

export default router;

