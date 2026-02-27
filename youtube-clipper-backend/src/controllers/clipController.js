const youTubeService = require('../services/youtubeService');
const ffmpegService = require('../services/ffmpegService');
const aiService = require('../services/aiService');
const socialMediaService = require('../services/socialMediaService');
const { db, supabase } = require('../config/database');
const path = require('path');

class ClipController {
    // Iniciar processamento de vídeo
    async processVideo(req, res) {
        const { videoId } = req.params;

        try {
            const { data: video, error } = await supabase
                .from('videos')
                .select('*, channels(*)')
                .eq('id', videoId)
                .single();

            if (error || !video) {
                return res.status(404).json({ error: 'Vídeo não encontrado' });
            }

            // Atualizar status
            await db.updateVideoStatus(videoId, 'processing');

            // 1. Download do vídeo
            const videoUrl = `https://youtube.com/watch?v=${video.youtube_video_id}`;
            const downloadPath = path.join(__dirname, '../../uploads', `${videoId}.mp4`);

            await youTubeService.downloadVideo(videoUrl, downloadPath);

            // 2. Extrair áudio para transcrição
            const audioPath = path.join(__dirname, '../../uploads', `${videoId}.mp3`);
            await ffmpegService.extractAudio(downloadPath, audioPath);

            // 3. Transcrever
            const transcription = await aiService.transcribeAudio(audioPath);

            // 4. Analisar momentos virais
            const analysis = await aiService.analyzeTranscription(transcription);

            // 5. Criar clips
            const clips = [];
            for (const clipData of analysis.clips) {
                const startSeconds = this.timeToSeconds(clipData.start);
                const duration = this.timeToSeconds(clipData.end) - startSeconds;

                const clipPath = await ffmpegService.extractVerticalClip(
                    downloadPath,
                    startSeconds,
                    duration,
                    `${videoId}_${clips.length}`
                );

                // Upload para storage
                const fileName = `${videoId}_${clips.length}.mp4`;
                const fileBuffer = require('fs').readFileSync(clipPath);

                await db.uploadFile('clips', fileName, fileBuffer);
                const publicUrl = await db.getPublicUrl('clips', fileName);

                // Salvar no banco
                const clip = await db.createClip({
                    video_id: videoId,
                    title: clipData.title,
                    start_time: clipData.start,
                    end_time: clipData.end,
                    viral_score: clipData.viral_score,
                    file_url: publicUrl,
                    status: 'ready',
                    hook: clipData.hook,
                    reason: clipData.reason
                });

                clips.push(clip);
            }

            // Atualizar vídeo como concluído
            await db.updateVideoStatus(videoId, 'completed', {
                transcription,
                processed_at: new Date()
            });

            res.json({ success: true, clips });

        } catch (error) {
            await db.updateVideoStatus(videoId, 'failed', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    }

    // Auto-postar clip nas redes sociais
    async autoPost(req, res) {
        const { clipId } = req.params;
        const { platforms } = req.body; // ['tiktok', 'instagram', 'youtube']

        try {
            const { data: clip } = await supabase
                .from('clips')
                .select('*, videos(*, channels(*))')
                .eq('id', clipId)
                .single();

            const results = [];
            const manualPlatforms = [];

            for (const platform of platforms) {
                try {
                    let result;
                    switch (platform) {
                        case 'instagram':
                            result = await socialMediaService.postToInstagram(
                                clip.file_url,
                                `${clip.title}\n\n${clip.hook}`,
                                clip.videos.channels.instagram_token,
                                clip.videos.channels.instagram_account_id
                            );
                            break;
                        case 'youtube':
                            result = await youTubeService.uploadShort(
                                clip.file_url,
                                clip.title,
                                clip.hook,
                                ['shorts', 'viral'],
                                clip.videos.channels.access_token
                            );
                            break;
                        default:
                            manualPlatforms.push(platform);
                            continue;
                    }
                    results.push(result);
                } catch (error) {
                    results.push({ platform, error: error.message });
                }
            }

            // Notificar para plataformas manuais (TikTok, Twitter, etc.)
            if (manualPlatforms.length > 0) {
                await socialMediaService.notifyUserForManualPost(
                    clip.videos.channels.user_id,
                    clip,
                    manualPlatforms
                );
            }

            await db.updateClipStatus(clipId, 'posted', {
                posted_at: new Date(),
                platforms: results
            });

            res.json({ success: true, results });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Listar clips de um vídeo
    async listClips(req, res) {
        try {
            const { videoId } = req.query;
            if (!videoId) return res.status(400).json({ error: 'videoId é obrigatório.' });
            const clips = await db.getClipsByVideo(videoId);
            res.json({ clips });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Detalhes de um clip
    async getClip(req, res) {
        try {
            const { data, error } = await supabase
                .from('clips')
                .select('*, videos(id, title, youtube_video_id, thumbnail)')
                .eq('id', req.params.clipId)
                .single();
            if (error) return res.status(404).json({ error: 'Clip não encontrado.' });
            res.json({ clip: data });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Deletar clip
    async deleteClip(req, res) {
        try {
            const { error } = await supabase.from('clips').delete().eq('id', req.params.clipId);
            if (error) throw error;
            res.json({ message: 'Clip deletado com sucesso.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // Converter HH:MM:SS ou MM:SS para segundos
    timeToSeconds(timeStr) {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return parts[0] * 60 + parts[1];
    }
}

module.exports = new ClipController();
