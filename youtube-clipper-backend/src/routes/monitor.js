// ============================================================
// routes/monitor.js
// Rotas de controle do monitor — status, trigger manual, etc.
// Montar em: app.use("/api/monitor", monitorRouter)
// ============================================================

const express = require('express');
const router = express.Router();
const channelMonitorService = require('../services/channelMonitorService');
const { supabase } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// ── GET /api/monitor/status ───────────────────────────────────────────────
// Retorna status de todos os canais monitorados
router.get("/status", authenticate, async (req, res) => {
    try {
        const { data: channels, error } = await supabase
            .from("channels")
            .select("id, name, status, last_check, last_video_id, last_error, is_active")
            .order("last_check", { ascending: false });

        if (error) throw error;

        const summary = {
            total: channels?.length || 0,
            monitoring: channels?.filter(c => c.is_active && c.status === "monitoring").length || 0,
            error: channels?.filter(c => c.status === "error").length || 0,
            paused: channels?.filter(c => !c.is_active).length || 0,
            interval: `${process.env.MONITOR_INTERVAL_MINUTES || 15} minutos`,
            channels: channels || [],
        };

        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/monitor/trigger ─────────────────────────────────────────────
// Dispara o monitor manualmente (todos os canais)
router.post("/trigger", authenticate, async (req, res) => {
    console.log(`[API] Monitor disparado manualmente por usuário ${req.user.id}`);

    // Roda em background, não bloqueia a resposta
    channelMonitorService.runChannelMonitor().catch(err => {
        console.error('[Monitor] Erro em execução manual disparada via API:', err);
    });

    res.json({ message: "Monitor disparado. Verificando canais em background..." });
});

// ── POST /api/monitor/trigger/:channelId ──────────────────────────────────
// Dispara o monitor para um canal específico
router.post("/trigger/:channelId", authenticate, async (req, res) => {
    const { channelId } = req.params;

    try {
        const { data: channel, error } = await supabase
            .from("channels")
            .select("*")
            .eq("id", channelId)
            .single();

        if (error || !channel) {
            return res.status(404).json({ error: "Canal não encontrado" });
        }

        console.log(`[API] Verificação manual do canal "${channel.name}" disparada por usuário ${req.user.id}`);

        // Roda em background
        channelMonitorService.checkChannel(channel).catch(err => {
            console.error(`[Monitor] Erro ao verificar canal ${channelId} manualmente:`, err);
        });

        res.json({ message: `Verificando canal "${channel.name}" em background...` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/monitor/channel/:channelId/pause ─────────────────────────────
// Pausa o monitoramento de um canal
router.put("/channel/:channelId/pause", authenticate, async (req, res) => {
    const { channelId } = req.params;
    try {
        const { error } = await supabase
            .from("channels")
            .update({ is_active: false, status: "paused" })
            .eq("id", channelId);

        if (error) throw error;
        res.json({ message: "Canal pausado com sucesso" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/monitor/channel/:channelId/resume ────────────────────────────
// Retoma o monitoramento de um canal pausado
router.put("/channel/:channelId/resume", authenticate, async (req, res) => {
    const { channelId } = req.params;
    try {
        const { error } = await supabase
            .from("channels")
            .update({ is_active: true, status: "monitoring", last_error: null })
            .eq("id", channelId);

        if (error) throw error;
        res.json({ message: "Canal retomado com sucesso" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
