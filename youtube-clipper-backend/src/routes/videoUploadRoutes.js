const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const { authenticate } = require('../middleware/auth');
const { supabase } = require('../config/database');
const clipController = require('../controllers/clipController');

const execAsync = promisify(exec);

// Configurar multer para salvar em uploads/manual/
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

/**
 * POST /api/videos/upload-file
 * Just uploads the file and creates a DB record.
 */
router.post("/upload-file",
    authenticate,
    upload.single("video"),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "Nenhum arquivo enviado" });
        }

        const userId = req.user.id;
        const filePath = req.file.path.replace(/\\/g, '/'); // Normalizar barras
        const fileName = req.body.originalName || req.file.originalname;

        try {
            // Obter duração com ffprobe
            const { stdout } = await execAsync(
                `ffprobe -v quiet -print_format json -show_format "${filePath}"`
            );
            const probe = JSON.parse(stdout);
            const duration = Math.floor(parseFloat(probe.format?.duration || "0"));

            // Criar registro
            const video = await db.createVideo({
                user_id: userId,
                title: fileName.replace(/\.[^/.]+$/, ""), // remove extensão
                url: filePath,       // caminho local
                source: "manual_upload",
                duration,
                status: "uploaded",
            });

            res.json({
                videoId: video.id,
                filePath,
                duration,
                title: video.title,
            });

        } catch (err) {
            console.error('[Upload Error]:', err);
            if (fs.existsSync(filePath)) try { fs.unlinkSync(filePath); } catch (_) { }
            res.status(500).json({ error: err.message });
        }
    }
);

/**
 * POST /api/videos/process-with-options
 * Re-routes to ClipController logic.
 */
router.post("/process-with-options", authenticate, async (req, res) => {
    console.log("[process-with-options] Body recebido:", JSON.stringify(req.body));
    console.log("[process-with-options] UserId:", req.user?.id);

    try {
        const { videoId, youtubeUrl, options = {} } = req.body;

        if (youtubeUrl) {
            req.body.url = youtubeUrl;
            return clipController.processUrl(req, res);
        } else if (videoId) {
            // Atualizar opções primeiro
            await supabase.from("videos").update({ processing_options: options }).eq("id", videoId);
            // O controller agora aceita videoId no body ou params
            return clipController.processVideo(req, res);
        } else {
            return res.status(400).json({ error: "videoId ou youtubeUrl é obrigatório" });
        }
    } catch (err) {
        console.error("[process-with-options] CRASH:", err.message, err.stack);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
