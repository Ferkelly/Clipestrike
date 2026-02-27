const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const clipController = require('../controllers/clipController');

// GET    /api/clips?videoId=...        → Listar clips de um vídeo
router.get('/', authenticate, (req, res) => clipController.listClips(req, res));

// GET    /api/clips/:clipId            → Detalhes de um clip
router.get('/:clipId', authenticate, (req, res) => clipController.getClip(req, res));

// POST   /api/clips/video/:videoId/process → Pipeline completa: download → audio → AI → FFmpeg → storage
router.post('/video/:videoId/process', authenticate, (req, res) => clipController.processVideo(req, res));

// POST   /api/clips/:clipId/autopost  → Auto-postar nas redes sociais
router.post('/:clipId/autopost', authenticate, (req, res) => clipController.autoPost(req, res));

// DELETE /api/clips/:clipId
router.delete('/:clipId', authenticate, (req, res) => clipController.deleteClip(req, res));

module.exports = router;
