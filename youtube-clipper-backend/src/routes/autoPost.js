// ============================================================
// routes/autoPost.js
// Rotas de publicação automática via Upload-Post.com
// ============================================================

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const autoPostService = require('../services/autoPostService');
const path = require('path');

// ── GET /api/autopost/platforms ───────────────────────────────────────────
// Retorna plataformas disponíveis e configuração do usuário
router.get("/platforms", authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("user_platform_configs")
            .select("*")
            .eq("user_id", req.user.id)
            .single();

        res.json({
            configured: !!data,
            uploadPostUser: data?.upload_post_user || null,
            enabledPlatforms: data?.enabled_platforms || [],
            available: ["tiktok", "instagram", "youtube", "facebook", "twitter", "linkedin"],
        });
    } catch (err) {
        res.json({ configured: false, enabledPlatforms: [], available: [] });
    }
});

// ── POST /api/autopost/platforms/config ───────────────────────────────────
// Salva configuração de plataformas do usuário
router.post("/platforms/config", authenticate, async (req, res) => {
    const { uploadPostUser, enabledPlatforms, autoPost } = req.body;

    if (!uploadPostUser || !enabledPlatforms?.length) {
        return res.status(400).json({ error: "uploadPostUser e enabledPlatforms são obrigatórios" });
    }

    try {
        const { data, error } = await supabase
            .from("user_platform_configs")
            .upsert({
                user_id: req.user.id,
                upload_post_user: uploadPostUser,
                enabled_platforms: enabledPlatforms,
                auto_post: autoPost !== undefined ? autoPost : true,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: "Plataformas configuradas com sucesso!", data });
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
        // Busca o clip
        const { data: clip, error } = await supabase
            .from("clips")
            .select("*, videos(user_id)")
            .eq("id", clipId)
            .single();

        if (error || !clip) {
            return res.status(404).json({ error: "Clip não encontrado" });
        }

        // Nota: Verificando status 'done' conforme nova especificação
        // Mas aceita 'ready' também se o pipeline antigo o definiu.
        if (clip.status !== "done" && clip.status !== "ready") {
            return res.status(400).json({ error: "Clip ainda não está pronto para publicação" });
        }

        // Busca config do usuário
        const { data: config } = await supabase
            .from("user_platform_configs")
            .select("*")
            .eq("user_id", req.user.id)
            .single();

        if (!config?.upload_post_user) {
            return res.status(400).json({
                error: "Configure o Upload-Post.com primeiro em /setup/platforms",
                redirect: "/setup/platforms",
            });
        }

        const targetPlatforms = platforms || config.enabled_platforms;

        if (!targetPlatforms || targetPlatforms.length === 0) {
            return res.status(400).json({ error: "Nenhuma plataforma selecionada para postagem." });
        }

        // Responde imediatamente, processa em background
        res.json({
            message: `Publicando clip em ${targetPlatforms.join(", ")}...`,
            clipId,
            platforms: targetPlatforms,
        });

        // Resolve o caminho do arquivo
        const filePath = clip.file_url.startsWith("http")
            ? await autoPostService.downloadClipToTemp(clip.file_url, clip.id)
            : path.resolve(clip.file_url);

        autoPostService.publishClip({
            clipId: clip.id,
            clipFilePath: filePath,
            title: clip.hook || clip.title || "Clip automático ⚡",
            platforms: targetPlatforms,
            uploadPostUser: config.upload_post_user,
            scheduledDate,
        }).catch(console.error);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/autopost/video/:videoId/all ─────────────────────────────────
// Publica todos os clips prontos de um vídeo
router.post("/video/:videoId/all", authenticate, async (req, res) => {
    const { videoId } = req.params;
    res.json({ message: "Publicando todos os clips prontos em background..." });
    autoPostService.autoPublishReadyClips(videoId, req.user.id).catch(console.error);
});

// ── GET /api/autopost/clip/:clipId/status ─────────────────────────────────
// Retorna o status de publicação de um clip
router.get("/clip/:clipId/status", authenticate, async (req, res) => {
    const { clipId } = req.params;
    try {
        const { data: clip, error } = await supabase
            .from("clips")
            .select("id, title, post_status, post_results, posted_at, posted_platforms, post_error")
            .eq("id", clipId)
            .single();

        if (error || !clip) return res.status(404).json({ error: "Clip não encontrado" });
        res.json(clip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/autopost/connect ──────────────────────────────────────────────
// Redireciona o usuário para o Upload-Post.com para conectar as redes sociais
router.get("/connect", authenticate, (req, res) => {
    res.json({
        connectUrl: "https://app.upload-post.com/welcome",
        instructions: [
            "1. Acesse https://app.upload-post.com/welcome",
            "2. Crie uma conta ou faça login",
            "3. Conecte suas redes sociais (TikTok, Instagram, YouTube...)",
            "4. Copie seu username do Upload-Post",
            "5. Cole o username na configuração do ClipStrike",
        ],
    });
});

module.exports = router;
