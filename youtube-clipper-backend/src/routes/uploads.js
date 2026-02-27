const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { uploadVideo, uploadFromYoutubeUrl } = require('../controllers/uploadController');

// POST /api/uploads/video        → Upload de arquivo de vídeo local
router.post('/video', authenticate, uploadVideo);
// POST /api/uploads/youtube-url  → Processar por URL do YouTube
router.post('/youtube-url', authenticate, uploadFromYoutubeUrl);

module.exports = router;
