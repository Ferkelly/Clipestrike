const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');

// GET  /api/user/settings → Obter settings
router.get('/settings', authenticate, getSettings);

// PUT  /api/user/settings → Atualizar settings
router.put('/settings', authenticate, updateSettings);

module.exports = router;
