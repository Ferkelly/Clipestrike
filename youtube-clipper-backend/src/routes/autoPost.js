// ============================================================
// routes/autoPost.js
// Rotas de publicação automática via Upload-Post.com (White-Label)
// ============================================================

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const autoPostService = require('../services/autoPostService');
const path = require('path');

// ── GET /api/autopost/platforms ───────────────────────────────────────────
// DEPRECATED: Use /status. Mantido para compatibilidade inicial do frontend
router.get("/platforms", authenticate, async (req, res) => {
    try {
        const status = await autoPostService.getPlatformStatus(req.user.id);
        const { data: config } = await supabase
            .from("user_platform_configs")
            .select("*")
            .eq("user_id", req.user.id)
            .single();

        res.json({
            configured: status.connected,
            uploadPostUser: status.uploadPostUser,
            enabledPlatforms: config?.enabled_platforms || [],
            available: ["tiktok", "instagram", "youtube", "facebook"],
            realPlatforms: status.platforms
        });
    } catch (err) {
        res.json({ configured: false, enabledPlatforms: [], available: [] });
    }
});

// ── GET /api/autopost/status ──────────────────────────────────────────────
// Retorna o status real das contas socais do usuário
router.get("/status", authenticate, async (req, res) => {
    try {
        const status = await autoPostService.getPlatformStatus(req.user.id);
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/autopost/connect ──────────────────────────────────────────────
// Gera o link de conexão personalizado (White-Label) para o usuário
router.get("/connect", authenticate, async (req, res) => {
    try {
        const data = await autoPostService.getConnectUrl(req.user.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/autopost/platforms/config ───────────────────────────────────
// Salva configuração de plataformas do usuário (preferências de postagem)
router.post("/platforms/config", authenticate, async (req, res) => {
    const { enabledPlatforms, autoPost } = req.body;

    try {
        const { data, error } = await supabase
            .from("user_platform_configs")
            .upsert({
                user_id: req.user.id,
                enabled_platforms: enabledPlatforms,
                auto_post: autoPost !== undefined ? autoPost : true,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: "Configurações salvas!", data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/autopost/clip/:clipId ───────────────────────────────────────
// Publica um clip específico nas plataformas configuradas
router.post("/clip/:clipId", authenticate, async (req, res) => {
    const { clipId } = req.params;
    const { platforms, scheduledDate } = req.body;

    try {
        const { data: clip, error } = await supabase
            .from("clips")
            .select("*, videos(user_id)")
            .eq("id", clipId)
            .single();

        if (error || !clip) return res.status(404).json({ error: "Clip não encontrado" });
        if (clip.status !== "done" && clip.status !== "ready") {
            return res.status(400).json({ error: "Clip ainda não está pronto" });
        }

        const { data: config } = await supabase
            .from("user_platform_configs")
            .select("*")
            .eq("user_id", req.user.id)
            .single();

        if (!config?.upload_post_username) {
            return res.status(400).json({ error: "Conecte suas plataformas primeiro." });
        }

        const targetPlatforms = platforms || config.enabled_platforms;
        if (!targetPlatforms || targetPlatforms.length === 0) {
            return res.status(400).json({ error: "Nenhuma plataforma selecionada." });
        }

        res.json({ message: "Publicação iniciada...", clipId, platforms: targetPlatforms });

        const filePath = clip.file_url.startsWith("http")
            ? await autoPostService.downloadClipToTemp(clip.file_url, clip.id)
            : path.resolve(clip.file_url);

        autoPostService.publishClip({
            clipId: clip.id,
            clipFilePath: filePath,
            title: clip.hook || clip.title || "Clip automático ⚡",
            platforms: targetPlatforms,
            uploadPostUser: config.upload_post_username,
            scheduledDate,
        }).catch(console.error);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
