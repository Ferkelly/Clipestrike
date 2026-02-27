const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { listChannels, addChannel, getChannel, toggleMonitoring, deleteChannel } = require('../controllers/channelController');

// GET    /api/channels         → Listar canais do usuário
router.get('/', authenticate, listChannels);
// POST   /api/channels         → Adicionar canal por URL
router.post('/', authenticate, addChannel);
// GET    /api/channels/:id     → Detalhes
router.get('/:id', authenticate, getChannel);
// PATCH  /api/channels/:id/monitoring
router.patch('/:id/monitoring', authenticate, toggleMonitoring);
// DELETE /api/channels/:id
router.delete('/:id', authenticate, deleteChannel);

module.exports = router;
