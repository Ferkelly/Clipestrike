const express = require("express");
const router = express.Router();
const { subscribeToChannel, unsubscribeFromChannel } = require("../services/webhookService");
const { authenticate } = require("../middleware/auth");

// POST /api/webhook/subscribe/:channelId
// Permite forçar uma inscrição manualmente (útil para debug)
router.post("/subscribe/:channelId", authenticate, async (req, res) => {
    const { channelId } = req.params;
    try {
        await subscribeToChannel(channelId);
        res.json({ success: true, message: `Inscrito no canal ${channelId}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/webhook/unsubscribe/:channelId
router.post("/unsubscribe/:channelId", authenticate, async (req, res) => {
    const { channelId } = req.params;
    try {
        await unsubscribeFromChannel(channelId);
        res.json({ success: true, message: `Desinscrito do canal ${channelId}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
