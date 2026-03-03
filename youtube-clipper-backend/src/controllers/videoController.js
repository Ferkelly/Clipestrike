const { db, supabase } = require('../config/database');
const { youtube } = require('../config/youtube');
const logger = require('../utils/logger');
const clipController = require('./clipController');

// GET /api/videos?channelId=...
const listVideos = async (req, res) => {
    try {
        const { channelId, status, limit = 20, offset = 0 } = req.query;
        if (!channelId) return res.status(400).json({ error: 'channelId é obrigatório.' });

        let query = supabase
            .from('videos')
            .select('*')
            .eq('channel_id', channelId)
            .order('published_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;
        res.json({ videos: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/videos/fetch → Importar vídeos do YouTube para o banco
const fetchVideos = async (req, res) => {
    try {
        const { channelId, maxResults = 10 } = req.body;
        if (!channelId) return res.status(400).json({ error: 'channelId é obrigatório.' });

        const { data: channel, error: chErr } = await supabase
            .from('channels')
            .select('*')
            .eq('id', channelId)
            .eq('user_id', req.user.id)
            .single();
        if (chErr || !channel) return res.status(403).json({ error: 'Canal não encontrado.' });

        const chRes = await youtube.channels.list({
            part: ['contentDetails'],
            id: [channel.youtube_channel_id],
        });
        const uploadsPlaylistId = chRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsPlaylistId) return res.status(400).json({ error: 'Playlist de uploads não encontrada.' });

        const plRes = await youtube.playlistItems.list({
            part: ['contentDetails', 'snippet'],
            playlistId: uploadsPlaylistId,
            maxResults: Number(maxResults),
        });

        const savedVideos = [];
        for (const item of plRes.data.items) {
            const vId = item.contentDetails.videoId;
            const existing = await db.getVideoByYoutubeId(vId);
            if (!existing) {
                const saved = await db.createVideo({
                    user_id: req.user.id,
                    channel_id: channelId,
                    youtube_video_id: vId,
                    title: item.snippet?.title,
                    description: item.snippet?.description,
                    thumbnail: item.snippet?.thumbnails?.high?.url,
                    published_at: item.snippet?.publishedAt,
                    status: 'pending',
                });
                savedVideos.push(saved);
            }
        }

        res.json({ message: `${savedVideos.length} novos vídeos importados.`, videos: savedVideos });
    } catch (err) {
        logger.error(`fetchVideos error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/videos/:id
const getVideo = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*, clips(*)')
            .eq('id', req.params.id)
            .single();
        if (error) return res.status(404).json({ error: 'Vídeo não encontrado.' });
        res.json({ video: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/videos/:id/process → Delega para o ClipController
const processVideo = async (req, res) => {
    return clipController.processVideo(req, res);
};

module.exports = { listVideos, fetchVideos, getVideo, processVideo };
