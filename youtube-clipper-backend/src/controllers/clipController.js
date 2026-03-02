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
        const fs = require('fs');
        const io = req.app.get('io');
        const emitProgress = (step, percent, msg) => {
            console.log(`[Process] [${percent}%] ${msg}`);
            io?.emit('video-progress', { videoId, step, percent: Math.round(percent), message: msg });
        };

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
            res.json({ success: true, message: 'Processamento iniciado' });

            // Processamento em background
            setImmediate(async () => {
                try {
                    // 1. Download do vídeo
                    emitProgress('DOWNLOADING', 10, 'Baixando vídeo do YouTube...');
                    const videoUrl = `https://youtube.com/watch?v=${video.youtube_video_id}`;
                    const downloadPath = path.join(__dirname, '../../uploads', `${videoId}.mp4`);

                    if (!fs.existsSync(path.dirname(downloadPath))) {
                        fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
                    }

                    await youTubeService.downloadVideo(videoUrl, downloadPath);

                    // 2. Transcrever com sincronia de palavras (Word-level timestamps)
                    emitProgress('TRANSCRIBING', 20, 'Extraindo áudio e transcrevendo (IA)...');
                    const audioPath = path.join(__dirname, '../../uploads', `${videoId}.mp3`);
                    await ffmpegService.extractAudio(downloadPath, audioPath, (p) => {
                        emitProgress('TRANSCRIBING', 20 + (p * 0.05), 'Extraindo áudio...');
                    });

                    const transcriptionData = await aiService.transcribeWithWords(audioPath);
                    const transcription = transcriptionData.text;

                    // 3. Analisar momentos virais
                    emitProgress('AI_ANALYSIS', 30, 'Analisando momentos virais com IA...');
                    const analysis = await aiService.analyzeTranscription(transcription);

                    // 4. Calcular enquadramento inteligente (Smart Framing)
                    emitProgress('FRAMING', 40, 'Calculando enquadramento inteligente (Face Detection)...');
                    const framingData = await aiService.getSmartFraming(downloadPath);
                    const xOffset = framingData.x_offset_pct;

                    // 5. Criar clips com legendas dinâmicas
                    const subtitleGenerator = require('../utils/subtitleGenerator');
                    const clipsCount = analysis.clips.length;
                    const createdClips = [];

                    emitProgress('CLIPPING', 50, `Gerando ${clipsCount} clips virais...`);

                    for (let i = 0; i < clipsCount; i++) {
                        const startPercent = 50 + (i / clipsCount) * 50;
                        const clipData = analysis.clips[i];

                        emitProgress('CLIPPING_PROGRESS', startPercent, `Clip ${i + 1} de ${clipsCount}: ${clipData.title}`);

                        const startSeconds = this.timeToSeconds(clipData.start);
                        const endSeconds = this.timeToSeconds(clipData.end);
                        const duration = endSeconds - startSeconds;

                        if (duration <= 0) continue;

                        const clipWords = transcriptionData.words.filter(w =>
                            w.start >= startSeconds && w.end <= endSeconds
                        ).map(w => ({
                            ...w,
                            start: w.start - startSeconds,
                            end: w.end - startSeconds
                        }));

                        const assPath = path.join(__dirname, '../../uploads', `${videoId}_${i}.ass`);
                        subtitleGenerator.generateAss(clipWords, assPath);

                        const clipPath = await ffmpegService.extractVerticalClip(
                            downloadPath,
                            startSeconds,
                            duration,
                            `${videoId}_${i}`,
                            {
                                xOffset: xOffset,
                                subtitlesPath: assPath,
                                onProgress: (p) => {
                                    const stagePercent = (1 / clipsCount) * 50;
                                    const currentPercent = startPercent + (p / 100) * stagePercent;
                                    emitProgress('CLIPPING_PROGRESS', currentPercent, `Processando clip ${i + 1}...`);
                                }
                            }
                        );

                        const fileName = `${videoId}_${i}_${Date.now()}.mp4`;
                        const fileBuffer = fs.readFileSync(clipPath);

                        await db.uploadFile('clips', fileName, fileBuffer);
                        const publicUrl = await db.getPublicUrl('clips', fileName);

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

                        createdClips.push(clip);

                        if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath);
                        if (fs.existsSync(assPath)) fs.unlinkSync(assPath);
                    }

                    // Atualizar vídeo como concluído
                    await db.updateVideoStatus(videoId, 'completed', {
                        transcription,
                        processed_at: new Date()
                    });

                    // Limpar arquivos pesados
                    if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
                    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

                    io?.emit('video-progress', { videoId, status: 'done', clipsCount: createdClips.length });

                } catch (backgroundError) {
                    console.error('[ProcessVideo] Background error:', backgroundError);
                    await db.updateVideoStatus(videoId, 'failed', { error_message: backgroundError.message });
                    io?.emit('video-progress', { videoId, status: 'error', message: backgroundError.message });
                }
            });

        } catch (error) {
            console.error('[ProcessVideo] Immediate error:', error);
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
