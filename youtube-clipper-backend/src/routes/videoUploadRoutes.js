const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const { authenticate } = require('../middleware/auth');
const { db, supabase } = require('../config/database');
const clipController = require('../controllers/clipController');

const execAsync = promisify(exec);

// Configurar multer para salvar em /tmp/uploads/
// Em Windows, usamos o diretório temporário do sistema ou um local conhecido
const uploadDir = path.join(process.cwd(), 'uploads/manual');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
    fileFilter: (req, file, cb) => {
        const allowed = [".mp4", ".mov", ".avi", ".mkv"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error("Formato não suportado. Use MP4, MOV, AVI ou MKV."));
    },
});

// POST /api/videos/upload-file
router.post("/upload-file",
    authenticate,
    upload.single("video"),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "Nenhum arquivo enviado" });
        }

        const userId = req.user.id;
        const filePath = req.file.path.replace(/\\/g, '/'); // Normalizar barras para o banco
        const fileName = req.body.originalName || req.file.originalname;

        try {
            // Obter duração do vídeo com ffprobe
            const { stdout } = await execAsync(
                `ffprobe -v quiet -print_format json -show_format "${filePath}"`
            );
            const probe = JSON.parse(stdout);
            const duration = Math.floor(parseFloat(probe.format?.duration || "0"));

            // Criar registro no banco
            const { data: video, error } = await supabase
                .from("videos")
                .insert({
                    user_id: userId,
                    title: fileName.replace(/\.[^/.]+$/, ""), // remove extensão
                    url: filePath,       // caminho local
                    source: "manual_upload",
                    duration,
                    status: "uploaded",
                })
                .select()
                .single();

            if (error) throw error;

            res.json({
                videoId: video.id,
                filePath,
                duration,
                title: video.title,
            });

        } catch (err) {
            console.error('[Upload Error]:', err);
            // Limpar arquivo em caso de erro
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            res.status(500).json({ error: err.message });
        }
    }
);

// POST /api/videos/process-with-options
// Inicia pipeline com opções personalizadas
router.post("/process-with-options", authenticate, async (req, res) => {
    const {
        videoId,
        youtubeUrl,
        options = {}
    } = req.body;

    const {
        maxClips = 5,
        minDuration = 30,
        maxDuration = 60,
        silenceCut = true,
        dynamicZoom = true,
        broll = false,
        subtitles = true,
        subtitleStyle = "hormozi",
        subtitleLang = "pt",
        autoPublish = false,
    } = options;

    const userId = req.user.id;

    try {
        let video;

        if (youtubeUrl) {
            // Extrair videoId da URL
            const match = youtubeUrl.match(
                /(?:v=|youtu\.be\/|shorts\/|@[^/]+\/|channel\/|c\/)([^&?/]+)/
            );
            const youtubeVideoId = match?.[1];
            if (!youtubeVideoId) throw new Error("URL do YouTube inválida");

            const { data, error } = await supabase
                .from("videos")
                .insert({
                    user_id: userId,
                    youtube_video_id: youtubeVideoId,
                    url: youtubeUrl,
                    source: "manual_url",
                    status: "pending",
                })
                .select()
                .single();

            if (error) throw error;
            video = data;

        } else if (videoId) {
            // Vídeo já foi uploaded, só buscar
            const { data, error } = await supabase
                .from("videos")
                .select("*")
                .eq("id", videoId)
                .eq("user_id", userId)
                .single();

            if (error) throw error;
            video = data;
        }

        if (!video) throw new Error("Vídeo não encontrado");

        const processingOptions = {
            maxClips, minDuration, maxDuration,
            silenceCut, dynamicZoom, broll,
            subtitles, subtitleStyle, subtitleLang,
            autoPublish,
        };

        // Salvar opções de edição no banco
        await supabase
            .from("videos")
            .update({
                processing_options: processingOptions,
                status: "pending",
            })
            .eq("id", video.id);

        // Responder imediatamente
        res.json({ videoId: video.id });

        // Disparar pipeline com opções
        // Injetar o io do app (definido no server.js)
        const io = req.app.get('socketio');
        clipController.processVideoPipelineWithOptions(video.id, video, io, processingOptions).catch(console.error);

    } catch (err) {
        console.error('[ProcessWithOptions Error]:', err);
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
