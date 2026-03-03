const express = require('express');
const router = express.Router();
const { getInternalStats, getYoutubeStats } = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

// GET /api/analytics/internal → Stats ClipStrike
router.get('/internal', authenticate, getInternalStats);

// GET /api/analytics/youtube → Performance real do YouTube
router.get('/youtube', authenticate, getYoutubeStats);

module.exports = router;
