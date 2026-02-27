const { db, supabase } = require('../config/database');
const { youtube } = require('../config/youtube');
const AIService = require('../services/aiService');
const logger = require('../utils/logger');

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

        // Buscar canal no banco
        const { data: channel, error: chErr } = await supabase
            .from('channels')
            .select('*')
            .eq('id', channelId)
            .eq('user_id', req.user.id)
            .single();
        if (chErr || !channel) return res.status(403).json({ error: 'Canal não encontrado.' });

        // Obter playlist de uploads do YouTube
        const chRes = await youtube.channels.list({
            part: ['contentDetails'],
            id: [channel.youtube_channel_id],
        });
        const uploadsPlaylistId = chRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!uploadsPlaylistId) return res.status(400).json({ error: 'Playlist de uploads não encontrada.' });

        const plRes = await youtube.playlistItems.list({
            part: ['contentDetails'],
            playlistId: uploadsPlaylistId,
            maxResults: Number(maxResults),
        });

        const videoIds = plRes.data.items.map((i) => i.contentDetails.videoId);
        const ytVideos = await youtube.videos.list({
            part: ['snippet', 'statistics', 'contentDetails'],
            id: videoIds,
        });

        const savedVideos = [];
        for (const v of ytVideos.data.items) {
            const existing = await db.getVideoByYoutubeId(v.id);
            if (!existing) {
                const saved = await db.createVideo({
                    channel_id: channelId,
                    youtube_video_id: v.id,
                    title: v.snippet?.title,
                    description: v.snippet?.description,
                    thumbnail: v.snippet?.thumbnails?.high?.url,
                    duration: v.contentDetails?.duration,
                    view_count: parseInt(v.statistics?.viewCount || 0),
                    like_count: parseInt(v.statistics?.likeCount || 0),
                    published_at: v.snippet?.publishedAt,
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

// POST /api/videos/:id/process → Análise AI + criação dos clips
const processVideo = async (req, res) => {
    try {
        const { data: video, error } = await supabase
            .from('videos')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (error || !video) return res.status(404).json({ error: 'Vídeo não encontrado.' });

        await db.updateVideoStatus(video.id, 'processing');

        const io = req.app.get('io');
        const emit = (event, data) => io?.emit(`video-${video.id}`, { event, ...data });

        res.json({ message: 'Processamento iniciado.', videoId: video.id });

        setImmediate(async () => {
            try {
                emit('progress', { step: 'DOWNLOADING', message: 'Baixando vídeo do YouTube...' });

                const path = require('path');
                const fs = require('fs');
                const youTubeService = require('../services/youtubeService');
                const ffmpegService = require('../services/ffmpegService');
                const aiService = require('../services/aiService');

                // 1. Download do vídeo
                const videoUrl = `https://youtube.com/watch?v=${video.youtube_video_id}`;
                const uploadDir = path.join(__dirname, '../../uploads');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const downloadPath = path.join(uploadDir, `${video.id}.mp4`);

                await youTubeService.downloadVideo(videoUrl, downloadPath);

                emit('progress', { step: 'EXTRACTING_AUDIO', message: 'Extraindo áudio para análise...' });

                // 2. Extrair áudio
                const audioPath = path.join(uploadDir, `${video.id}.mp3`);
                await ffmpegService.extractAudio(downloadPath, audioPath);

                emit('progress', { step: 'TRANSCRIBING', message: 'Transcrevendo áudio...' });

                // 3. Transcrever
                const transcription = await aiService.transcribeAudio(audioPath);

                emit('progress', { step: 'AI_ANALYSIS', message: 'Analisando momentos virais com IA...' });

                // 4. Analisar momentos virais
                const analysis = await aiService.analyzeTranscription(transcription);

                emit('progress', { step: 'CLIPPING', message: `Criando ${analysis.clips?.length || 0} clips virais...` });

                // Função auxiliar para converter "HH:MM:SS" em segundos
                const timeToSeconds = (timeStr) => {
                    if (!timeStr) return 0;
                    const parts = String(timeStr).split(':').map(Number);
                    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                    if (parts.length === 2) return parts[0] * 60 + parts[1];
                    return Number(timeStr) || 0;
                };

                const clipsData = analysis.clips || [];
                const createdClips = [];

                for (let i = 0; i < clipsData.length; i++) {
                    const clipData = clipsData[i];
                    emit('progress', { step: 'CLIPPING_PROGRESS', message: `Recortando clip ${i + 1} de ${clipsData.length}...` });

                    const startSeconds = timeToSeconds(clipData.start);
                    const endSeconds = timeToSeconds(clipData.end);
                    const duration = endSeconds - startSeconds;

                    if (duration <= 0) continue;

                    try {
                        // 5. Extrair clip vertical com o FFmpeg
                        const clipPath = await ffmpegService.extractVerticalClip(
                            downloadPath,
                            startSeconds,
                            duration,
                            `${video.id}_${i}`
                        );

                        // Upload para Supabase Storage (Assumindo que db.uploadFile está funcionando)
                        const fileName = `${video.id}_${i}_${Date.now()}.mp4`;
                        const fileBuffer = fs.readFileSync(clipPath);
                        await db.uploadFile('clips', fileName, fileBuffer);
                        const publicUrl = await db.getPublicUrl('clips', fileName);

                        // Salvar clip no banco
                        const clip = await db.createClip({
                            video_id: video.id,
                            title: clipData.title || `Clip ${i + 1}`,
                            start_time: String(clipData.start),
                            end_time: String(clipData.end),
                            duration: duration,
                            viral_score: clipData.viral_score || 70,
                            status: 'ready',
                            file_url: publicUrl,
                            hook: clipData.hook || '',
                            reason: clipData.reason || ''
                        });

                        createdClips.push(clip);

                        // Limpar arquivo do clip local
                        fs.unlinkSync(clipPath);
                    } catch (clipErr) {
                        console.error(`Erro ao gerar clip ${i}:`, clipErr);
                    }
                }

                // Limpar arquivos temporários pesados
                if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
                if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

                await db.updateVideoStatus(video.id, 'completed', {
                    processed_at: new Date()
                });

                emit('done', { clipsCount: createdClips.length });
            } catch (err) {
                logger.error(`processVideo error: ${err.message}`);
                await db.updateVideoStatus(video.id, 'failed', { error_message: err.message });
                emit('error', { message: err.message });
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { listVideos, fetchVideos, getVideo, processVideo };
