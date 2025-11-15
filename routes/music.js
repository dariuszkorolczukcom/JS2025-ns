const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');

// GET /api/music - Get all music entries
router.get('/', musicController.getAllMusic);

// GET /api/music/:id - Get music by ID
router.get('/:id', musicController.getMusicById);

// POST /api/music - Create new music entry
router.post('/', musicController.createMusic);

module.exports = router;

