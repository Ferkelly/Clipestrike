const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { youtube } = require('../config/youtube');
const FFmpegService = require('../services/ffmpegService');
const logger = require('../utils/logger');

// Configuração multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
        if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
            return cb(new Error('Formato de vídeo não suportado.'));
        }
        cb(null, true);
    },
});

// POST /api/uploads/video → Upload de arquivo local
const uploadVideo = [
    upload.single('video'),
    async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'Nenhum vídeo recebido.' });

            const meta = await FFmpegService.probeVideo(req.file.path);
            const videoStream = meta.streams.find((s) => s.codec_type === 'video');

            logger.info(`Upload: ${req.file.filename} (${(req.file.size / 1024 / 1024).toFixed(1)}MB)`);

            res.json({
                message: 'Upload bem-sucedido.',
                file: {
                    path: req.file.path,
                    filename: req.file.filename,
                    size: req.file.size,
                    duration: meta.format.duration,
                    resolution: `${videoStream?.width}x${videoStream?.height}`,
                },
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
];

// POST /api/uploads/youtube-url → Processar por URL do YouTube
const uploadFromYoutubeUrl = async (req, res) => {
    try {
        const { url, channelId } = req.body;
        if (!url) return res.status(400).json({ error: 'URL do YouTube é obrigatória.' });

        // Extrair videoId
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (!match) return res.status(400).json({ error: 'URL do YouTube inválida.' });
        const videoId = match[1];

        const ytRes = await youtube.videos.list({
            part: ['snippet', 'contentDetails', 'statistics'],
            id: [videoId],
        });
        const v = ytRes.data.items?.[0];
        if (!v) return res.status(404).json({ error: 'Vídeo não encontrado no YouTube.' });

        // Verificar se já existe no banco
        let video = await db.getVideoByYoutubeId(videoId);
        if (!video && channelId) {
            video = await db.createVideo({
                channel_id: channelId,
                youtube_video_id: v.id,
                title: v.snippet?.title,
                description: v.snippet?.description,
                thumbnail: v.snippet?.thumbnails?.high?.url,
                duration: v.contentDetails?.duration,
                view_count: parseInt(v.statistics?.viewCount || 0),
                published_at: v.snippet?.publishedAt,
                status: 'pending',
            });
        }

        res.json({
            message: 'Vídeo identificado.',
            video,
            youtubeDetails: {
                title: v.snippet?.title,
                thumbnail: v.snippet?.thumbnails?.high?.url,
                duration: v.contentDetails?.duration,
            },
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

module.exports = { uploadVideo, uploadFromYoutubeUrl };
