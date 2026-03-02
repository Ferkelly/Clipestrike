// ============================================================
// routes/autoPost.js
// Rotas de controle do auto-post e configurações de rede
// ============================================================

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const autoPostService = require('../services/autoPostService');

// ── GET /api/autopost/platforms ───────────────────────────────────────────
// Retorna a configuração de plataformas do usuário
router.get("/platforms", authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("user_platform_configs")
            .select("*")
            .eq("user_id", req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || { up_username: "", platforms: [], auto_post: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/autopost/platforms/config ───────────────────────────────────
// Salva a configuração de plataformas do usuário
router.post("/platforms/config", authenticate, async (req, res) => {
    const { up_username, platforms, auto_post } = req.body;
    try {
        const { data, error } = await supabase
            .from("user_platform_configs")
            .upsert({
                user_id: req.user.id,
                up_username,
                platforms,
                auto_post,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/autopost/clip/:id ───────────────────────────────────────────
// Publica um clip específico manualmente
router.post("/clip/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const { data: clip, error: clipErr } = await supabase
            .from("clips")
            .select("*, video:videos(title)")
            .eq("id", id)
            .single();

        if (clipErr || !clip) return res.status(404).json({ error: "Clip não encontrado" });

        const { data: config } = await supabase
            .from("user_platform_configs")
            .select("*")
            .eq("user_id", req.user.id)
            .single();

        if (!config || !config.up_username) {
            return res.status(400).json({ error: "Configure seu username do Upload-Post primeiro" });
        }

        // Resolvendo caminho do arquivo
        const filePath = clip.file_url.startsWith("http")
            ? clip.file_url
            : require('path').resolve(clip.file_url);

        // Dispara em background
        autoPostService.publishClip({
            clipId: clip.id,
            clipFilePath: filePath,
            title: clip.hook || clip.title || "Clip",
            platforms: config.platforms,
            uploadPostUser: config.up_username
        }).catch(console.error);

        res.json({ message: "Publicação iniciada em background" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/autopost/clip/:id/status ─────────────────────────────────────
// Consulta status de postagem de um clip
router.get("/clip/:id/status", authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("clips")
            .select("post_status, post_results, posted_at, posted_platforms")
            .eq("id", req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
