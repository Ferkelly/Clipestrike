// ============================================================
// routes/platform.js
// Rotas de conexão direta com plataformas (YouTube OAuth 2.0)
// ============================================================

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { supabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Configuração do Cliente OAuth2 do Google
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.API_BASE_URL}/api/platforms/youtube/callback`
);

// ── GET /api/platforms/youtube/connect ─────────────────────
// Redireciona para tela de permissões do Google
router.get("/youtube/connect", authenticate, (req, res) => {
    const userId = req.user.id;

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent", // força mostrar tela de permissões sempre
        include_granted_scopes: true,
        scope: [
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/yt-analytics.readonly",
            "openid",
            "email",
            "profile",
        ],
        state: userId, // passa o userId para recuperar no callback
    });

    res.redirect(authUrl);
});

// ── GET /api/platforms/youtube/callback ────────────────────
// Google redireciona aqui após o usuário aceitar
router.get("/youtube/callback", async (req, res) => {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard/plataformas?error=cancelled`);
    }

    try {
        // Troca o code por tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Busca info do canal do YouTube
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });
        const channelRes = await youtube.channels.list({
            part: ["snippet"],
            mine: true,
        });

        const channel = channelRes.data.items?.[0];
        const channelName = channel?.snippet?.title || "Meu Canal";
        const channelId = channel?.id || "";

        // Salva tokens no Supabase
        const { error } = await supabase
            .from("platform_connections")
            .upsert({
                user_id: userId,
                platform: "youtube",
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token || null,
                expires_at: tokens.expiry_date
                    ? new Date(tokens.expiry_date).toISOString()
                    : null,
                platform_user_id: channelId,
                platform_username: channelName,
                connected_at: new Date().toISOString(),
            }, { onConflict: "user_id,platform" });

        if (error) throw error;

        // Volta para o dashboard com sucesso
        res.redirect(
            `${process.env.FRONTEND_URL}/dashboard/plataformas?connected=youtube&channel=${encodeURIComponent(channelName)}`
        );

    } catch (err) {
        console.error("[YouTube OAuth] Erro:", err.message);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/plataformas?error=youtube_failed`);
    }
});

// ── GET /api/platforms/status ──────────────────────────────
// Retorna todas as plataformas conectadas do usuário
router.get("/status", authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("platform_connections")
            .select("platform, platform_username, connected_at")
            .eq("user_id", req.user.id);

        if (error) throw error;

        // Transforma em objeto { youtube: {...}, tiktok: {...} }
        const platforms = {};
        for (const conn of data || []) {
            platforms[conn.platform] = {
                connected: true,
                username: conn.platform_username,
                connectedAt: conn.connected_at,
            };
        }

        res.json(platforms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/platforms/:platform ────────────────────────
// Desconecta uma plataforma
router.delete("/:platform", authenticate, async (req, res) => {
    try {
        const { error } = await supabase
            .from("platform_connections")
            .delete()
            .eq("user_id", req.user.id)
            .eq("platform", req.params.platform);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/platforms/youtube/upload/:clipId ─────────────
// Upload manual de um clip específico
router.post("/youtube/upload/:clipId", authenticate, async (req, res) => {
    const { clipId } = req.params;
    const userId = req.user.id;

    try {
        const youtubeService = require('../services/youtubeService');

        // Retorna imediato para não travar o front, mas processa em background
        res.json({ success: true, message: "Upload para o YouTube iniciado em background." });

        youtubeService.uploadYouTubeShort(clipId, userId).catch(err => {
            console.error(`[Manual Upload Error] Clip ${clipId}:`, err.message);
        });

    } catch (err) {
        console.error("[YouTube Manual Upload] Erro:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
