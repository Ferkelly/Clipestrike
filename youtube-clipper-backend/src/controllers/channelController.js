const { db } = require('../config/database');
const { youtube } = require('../config/youtube');
const logger = require('../utils/logger');

// GET /api/channels → Listar canais do usuário
const listChannels = async (req, res) => {
    try {
        const { data, error } = await require('../config/database').supabase
            .from('channels')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ channels: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/channels → Adicionar canal por URL ou handle
const addChannel = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL ou handle do canal é obrigatório.' });

        // Extrair handle ou ID da URL
        let identifier = url.trim();
        const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
        const channelIdMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);

        const params = { part: ['snippet', 'statistics', 'contentDetails'], maxResults: 1 };
        if (channelIdMatch) {
            params.id = [channelIdMatch[1]];
        } else if (handleMatch) {
            params.forHandle = handleMatch[1];
        } else if (identifier.startsWith('UC')) {
            params.id = [identifier];
        } else {
            params.forHandle = identifier.replace('@', '');
        }

        const ytRes = await youtube.channels.list(params);
        const ch = ytRes.data.items?.[0];
        if (!ch) return res.status(404).json({ error: 'Canal não encontrado no YouTube.' });

        // Verificar se já existe
        const existing = await db.getChannelByYoutubeId(ch.id);
        if (existing) return res.status(409).json({ error: 'Canal já cadastrado.', channel: existing });

        const channel = await db.createChannel({
            user_id: req.user.id,
            youtube_channel_id: ch.id,
            title: ch.snippet?.title,
            description: ch.snippet?.description,
            thumbnail: ch.snippet?.thumbnails?.high?.url,
            subscriber_count: parseInt(ch.statistics?.subscriberCount || 0),
            video_count: parseInt(ch.statistics?.videoCount || 0),
            is_active: true,
        });

        logger.info(`Canal adicionado: ${channel.title} (user: ${req.user.id})`);
        res.status(201).json({ channel });
    } catch (err) {
        logger.error(`Erro ao adicionar canal: ${err.message}`);
        res.status(400).json({ error: err.message });
    }
};

// GET /api/channels/:id → Detalhes
const getChannel = async (req, res) => {
    try {
        const { data, error } = await require('../config/database').supabase
            .from('channels')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();
        if (error) return res.status(404).json({ error: 'Canal não encontrado.' });
        res.json({ channel: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/channels/:id/monitoring → Ativar/desativar monitoramento
const toggleMonitoring = async (req, res) => {
    try {
        const { isActive } = req.body;
        const { data, error } = await require('../config/database').supabase
            .from('channels')
            .update({ is_active: isActive, updated_at: new Date() })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();
        if (error) throw error;
        res.json({ channel: data, message: `Monitoramento ${isActive ? 'ativado' : 'desativado'}.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/channels/:id
const deleteChannel = async (req, res) => {
    try {
        const { error } = await require('../config/database').supabase
            .from('channels')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);
        if (error) throw error;
        res.json({ message: 'Canal removido com sucesso.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { listChannels, addChannel, getChannel, toggleMonitoring, deleteChannel };
