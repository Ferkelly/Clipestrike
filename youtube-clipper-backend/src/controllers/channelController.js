const { db } = require('../config/database');
const { youtube } = require('../config/youtube');
const logger = require('../utils/logger');
const axios = require('axios');

// Helper para descobrir o ID do canal raspando o HTML
const getChannelMetadataFromHtml = async (identifier) => {
    try {
        const url = identifier.includes('youtube.com') ? identifier : `https://www.youtube.com/${identifier.startsWith('@') ? identifier : '@' + identifier}`;
        console.log(`[Scraper] Fetching HTML for: ${url}`);
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 8000
        });

        const html = res.data;
        const idMatch = html.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/);
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
        const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/);
        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)">/);

        if (idMatch && idMatch[1]) {
            const metadata = {
                id: idMatch[1],
                title: titleMatch ? titleMatch[1] : 'YouTube Channel',
                description: descMatch ? descMatch[1] : '',
                thumbnail: imageMatch ? imageMatch[1] : null
            };
            console.log(`[Scraper] Scraped metadata for: ${metadata.title} (${metadata.id})`);
            return metadata;
        }

        console.log(`[Scraper] Could not find externalId in HTML.`);
        return null;
    } catch (e) {
        console.error(`[Scraper] Failed to scrape channel:`, e.message);
        return null;
    }
};

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
    console.log(`[AddChannel] Starting for user ${req.user.id}, URL: ${req.body?.url}`);
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL ou handle do canal é obrigatório.' });

        const identifier = url.trim();

        // 1. Tentar Scraping primeiro (é mais robusto para metadados básicos)
        const scraped = await getChannelMetadataFromHtml(identifier);

        let youtubeData = null;
        let channelId = scraped?.id;

        // 2. Tentar API para estatísticas e validação extra
        try {
            const params = {
                part: ['snippet', 'statistics', 'contentDetails'],
                maxResults: 1,
                auth: process.env.YOUTUBE_API_KEY
            };

            if (channelId) {
                params.id = [channelId];
            } else if (identifier.includes('youtube.com/@')) {
                params.forHandle = identifier.split('@').pop();
            } else if (identifier.startsWith('UC')) {
                params.id = [identifier];
            } else {
                params.forHandle = identifier.replace('@', '');
            }

            console.log(`[AddChannel] Fetching API for stats...`);
            const ytRes = await youtube.channels.list(params);
            youtubeData = ytRes.data.items?.[0];
            if (youtubeData) channelId = youtubeData.id;
        } catch (apiErr) {
            console.warn(`[AddChannel] API fetch failed, falling back to scraped data only:`, apiErr.message);
        }

        // Se não tem nem scraped nem api, falhou
        if (!channelId && !scraped) {
            return res.status(404).json({ error: 'Canal não encontrado no YouTube.' });
        }

        // 3. Mesclar dados (prioridade para API se disponível, senão scraper)
        const finalId = channelId || scraped.id;
        const finalTitle = youtubeData?.snippet?.title || scraped?.title || 'Unknown Channel';
        const finalDesc = youtubeData?.snippet?.description || scraped?.description || '';
        const finalThumb = youtubeData?.snippet?.thumbnails?.high?.url || scraped?.thumbnail;
        const subCount = parseInt(youtubeData?.statistics?.subscriberCount || 0);
        const videoCount = parseInt(youtubeData?.statistics?.videoCount || 0);

        console.log(`[AddChannel] Finalizing: ${finalTitle} (${finalId})`);

        // Verificar se já existe
        const existing = await db.getChannelByYoutubeId(finalId);
        if (existing) {
            console.log(`[AddChannel] Channel already exists: ${finalId}`);
            return res.status(409).json({ error: 'Canal já cadastrado.', channel: existing });
        }

        const channel = await db.createChannel({
            user_id: req.user.id,
            youtube_channel_id: finalId,
            title: finalTitle,
            description: finalDesc,
            thumbnail: finalThumb,
            subscriber_count: subCount,
            video_count: videoCount,
            is_active: true,
        });

        logger.info(`Canal adicionado: ${channel.title} (user: ${req.user.id})`);
        res.status(201).json({ channel });
    } catch (err) {
        console.error(`[AddChannel] Fatal error:`, err);
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
