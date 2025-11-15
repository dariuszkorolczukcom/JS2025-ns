const express = require('express');
const router = express.Router();

const usersRoutes = require('./users');
const musicRoutes = require('./music');
const reviewsRoutes = require('./reviews');

router.use('/users', usersRoutes);
router.use('/music', musicRoutes);
router.use('/reviews', reviewsRoutes);

module.exports = router;

