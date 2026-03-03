const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { listVideos, fetchVideos, getVideo, processVideo } = require('../controllers/videoController');

const clipController = require('../controllers/clipController');

// GET  /api/videos?channelId=...  → Listar vídeos do canal
router.get('/', authenticate, listVideos);

// POST /api/videos/import          → Iniciar processamento por URL (Padrão novo)
router.post('/import', authenticate, (req, res) => clipController.processUrl(req, res));

// POST /api/videos/fetch          → Importar vídeos do YouTube (Padrão antigo - Canais)
router.post('/fetch', authenticate, fetchVideos);
// GET  /api/videos/:id            → Detalhes do vídeo
router.get('/:id', authenticate, getVideo);
// POST /api/videos/:id/process    → Iniciar processamento AI
router.post('/:id/process', authenticate, processVideo);

module.exports = router;
