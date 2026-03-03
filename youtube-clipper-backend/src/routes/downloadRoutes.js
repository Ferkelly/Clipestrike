const express = require('express');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { supabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────

// Baixa arquivo remoto para /tmp
async function downloadToTemp(url, filename) {
    const tmpPath = path.join('/tmp', filename);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao baixar arquivo: ${res.status}`);
    const buffer = await res.buffer();
    fs.writeFileSync(tmpPath, buffer);
    return tmpPath;
}

// Limpa arquivo temporário
function cleanup(filePath) {
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
        logger.error(`Erro ao limpar arquivo temp: ${err.message}`);
    }
}

// Verifica se o clip pertence ao usuário
async function getClip(clipId, userId) {
    const { data } = await supabase
        .from("clips")
        .select("*")
        .eq("id", clipId)
        .eq("user_id", userId)
        .single();
    return data;
}

// Formatar segundos para formato SRT (HH:MM:SS,mmm)
function formatSrtTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

// ── ROTA 1: Download clip individual MP4 ─────────────────
// GET /api/download/clip/:clipId?quality=1080
router.get("/clip/:clipId", authenticate, async (req, res) => {
    try {
        const { clipId } = req.params;
        const quality = req.query.quality || "1080"; // "1080" | "720"
        const userId = req.user.id;

        const clip = await getClip(clipId, userId);
        if (!clip) return res.status(404).json({ error: "Clip não encontrado" });

        // Selecionar URL baseada na qualidade
        const fileUrl = quality === "720" && clip.file_url_720
            ? clip.file_url_720
            : clip.file_url;

        if (!fileUrl) return res.status(404).json({ error: "Arquivo não disponível" });

        const safeTitle = (clip.hook || clip.title || "clip")
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "_")
            .substring(0, 50);
        const filename = `${safeTitle}_${quality}p.mp4`;

        // Se for URL do Supabase Storage ou remota
        if (fileUrl.includes("supabase") || fileUrl.startsWith("http")) {
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.setHeader("Content-Type", "video/mp4");
            const fileRes = await fetch(fileUrl);
            return fileRes.body.pipe(res);
        }

        // Se for arquivo local na VPS
        if (fs.existsSync(fileUrl)) {
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.setHeader("Content-Type", "video/mp4");
            return fs.createReadStream(fileUrl).pipe(res);
        }

        res.status(404).json({ error: "Arquivo não encontrado" });
    } catch (err) {
        logger.error(`Download Error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// ── ROTA 2: Download legenda SRT ─────────────────────────
// GET /api/download/clip/:clipId/srt
router.get("/clip/:clipId/srt", authenticate, async (req, res) => {
    try {
        const clip = await getClip(req.params.clipId, req.user.id);
        if (!clip) return res.status(404).json({ error: "Clip não encontrado" });

        if (!clip.transcription) {
            return res.status(404).json({ error: "Transcrição não disponível para este clip" });
        }

        // Gerar SRT a partir da transcrição
        let srtContent = "";
        const segments = Array.isArray(clip.transcription)
            ? clip.transcription
            : [{ start: 0, end: 30, text: clip.transcription }];

        segments.forEach((seg, i) => {
            const startTime = formatSrtTime(seg.start || 0);
            const endTime = formatSrtTime(seg.end || (seg.start + 3));
            srtContent += `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n\n`;
        });

        const safeTitle = (clip.hook || clip.title || "clip")
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "_")
            .substring(0, 50);

        res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.srt"`);
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(srtContent);
    } catch (err) {
        logger.error(`SRT Export Error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// ── ROTA 3: Download ZIP com todos os clips de um vídeo ──
// GET /api/download/video/:videoId/zip?quality=1080
router.get("/video/:videoId/zip", authenticate, async (req, res) => {
    try {
        const { videoId } = req.params;
        const quality = req.query.quality || "1080";
        const userId = req.user.id;

        // Busca vídeo
        const { data: video } = await supabase
            .from("videos")
            .select("title")
            .eq("id", videoId)
            .eq("user_id", userId)
            .single();

        if (!video) return res.status(404).json({ error: "Vídeo não encontrado" });

        // Busca todos os clips prontos desse vídeo
        const { data: clips } = await supabase
            .from("clips")
            .select("*")
            .eq("video_id", videoId)
            .eq("user_id", userId)
            .eq("status", "ready") // Ajustado de 'done' para 'ready' se for o padrão do sistema
            .order("viral_score", { ascending: false });

        if (!clips?.length) {
            return res.status(404).json({ error: "Nenhum clip disponível para download" });
        }

        const safeVideoTitle = (video.title || "clips")
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "_")
            .substring(0, 40);

        res.setHeader("Content-Disposition", `attachment; filename="ClipStrike_${safeVideoTitle}.zip"`);
        res.setHeader("Content-Type", "application/zip");

        const archive = archiver("zip", { zlib: { level: 6 } });
        archive.on("error", (err) => { throw err; });
        archive.pipe(res);

        const tempFiles = [];

        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const fileUrl = quality === "720" && clip.file_url_720
                ? clip.file_url_720
                : clip.file_url;

            if (!fileUrl) continue;

            const safeHook = (clip.hook || clip.title || `clip_${i + 1}`)
                .replace(/[^a-zA-Z0-9\s-]/g, "")
                .replace(/\s+/g, "_")
                .substring(0, 40);

            const filename = `${String(i + 1).padStart(2, "0")}_score${clip.viral_score}_${safeHook}.mp4`;

            try {
                if (fileUrl.includes("supabase") || fileUrl.startsWith("http")) {
                    // Baixar para temp antes de zipar
                    const tmpPath = await downloadToTemp(fileUrl, `zip_temp_${clip.id}.mp4`);
                    tempFiles.push(tmpPath);
                    archive.file(tmpPath, { name: filename });
                } else if (fs.existsSync(fileUrl)) {
                    archive.file(fileUrl, { name: filename });
                }
            } catch (err) {
                logger.error(`[Download ZIP] Erro no clip ${clip.id}: ${err.message}`);
            }
        }

        // Incluir um README.txt no ZIP
        const readmeContent = clips.map((c, i) =>
            `${i + 1}. [Score: ${c.viral_score}/10] ${c.hook || c.title}`
        ).join("\n");

        archive.append(
            `ClipStrike — ${video.title}\nGerado em: ${new Date().toLocaleDateString("pt-BR")}\n\nClips (ordenados por viral score):\n${readmeContent}`,
            { name: "README.txt" }
        );

        await archive.finalize();

        // Limpar temp após envio
        res.on("finish", () => tempFiles.forEach(cleanup));
    } catch (err) {
        logger.error(`ZIP Download Error: ${err.message}`);
        // res.status(500) might fail here if headers sent, but archiver usually handles it
    }
});

module.exports = router;
