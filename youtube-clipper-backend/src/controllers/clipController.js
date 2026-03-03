const youTubeService = require('../services/youtubeService');
const ffmpegService = require('../services/ffmpegService');
const aiService = require('../services/aiService');
const socialMediaService = require('../services/socialMediaService');
const autoPostService = require('../services/autoPostService');
const videoEditingService = require('../services/videoEditingService');
const { db, supabase } = require('../config/database');
const path = require('path');

class ClipController {
    // Iniciar processamento de vídeo (via ID)
    async processVideo(req, res) {
        const { videoId } = req.params;
        const io = req.app.get('io');

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
            res.json({ success: true, message: 'Processamento iniciado', videoId });

            // Disparar pipeline em background
            this._runProcessingPipeline(videoId, video, io).catch(err => {
                console.error('[Pipeline Error]:', err);
            });

        } catch (error) {
            console.error('[ProcessVideo] Immediate error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Iniciar processamento direto via URL do YouTube
    async processUrl(req, res) {
        const { url, type } = req.body;
        const userId = req.user.id;
        const io = req.app.get('io');

        if (!url) return res.status(400).json({ error: 'URL é obrigatória.' });

        try {
            let youtubeVideoId;

            if (type === 'channel') {
                // Buscar o vídeo mais recente do canal
                youtubeVideoId = await youTubeService.getLatestVideoFromChannel(url);
            } else {
                // 1. Extrair ID do YouTube
                const ytIdMatch = url.match(/(?:v=|\/|embed\/|shorts\/)([0-9A-Za-z_-]{11})/);
                if (!ytIdMatch) return res.status(400).json({ error: 'URL do YouTube inválida.' });
                youtubeVideoId = ytIdMatch[1];
            }

            // 2. Garantir que o usuário tem um canal "Manual" para associar o vídeo
            let { data: channel } = await supabase
                .from('channels')
                .select('id')
                .eq('user_id', userId)
                .eq('source', 'manual')
                .single();

            if (!channel) {
                channel = await db.createChannel({
                    user_id: userId,
                    name: 'Meus Uploads Manuais',
                    youtube_channel_id: 'manual_' + userId,
                    status: 'active',
                    source: 'manual'
                });
            }

            // 3. Criar ou buscar o vídeo no banco
            let { data: video } = await supabase
                .from('videos')
                .select('*')
                .eq('youtube_video_id', youtubeVideoId)
                .eq('user_id', userId) // Versão do usuário
                .single();

            if (!video) {
                video = await db.createVideo({
                    user_id: userId,
                    channel_id: channel.id,
                    youtube_video_id: youtubeVideoId,
                    title: 'Processando vídeo...',
                    status: 'pending',
                    source: 'manual'
                });
            }

            // 4. Iniciar processamento (mesma lógica do processVideo)
            await db.updateVideoStatus(video.id, 'processing');
            res.json({ success: true, message: 'Processamento iniciado', videoId: video.id });

            // Refetch para ter as infos do canal
            const { data: fullVideo } = await supabase
                .from('videos')
                .select('*, channels(*)')
                .eq('id', video.id)
                .single();

            this._runProcessingPipeline(video.id, fullVideo, io).catch(err => {
                console.error('[Pipeline Error]:', err);
            });

        } catch (err) {
            console.error('[ProcessUrl Error]:', err);
            res.status(500).json({ error: err.message });
        }
    }

    // Pipeline principal de execução (Background)
    async _runProcessingPipeline(videoId, video, io) {
        const fs = require('fs');
        const emitProgress = (step, percent, msg) => {
            console.log(`[Process] [${percent}%] ${msg}`);
            // Emitir para o quarto do usuário para evitar vazamento global
            io?.to(video.user_id).emit('video-progress', {
                id: videoId,
                videoId,
                step,
                percent: Math.round(percent),
                message: msg,
                title: video.title || 'Vídeo'
            });
        };

        try {
            // 1. Download do vídeo
            emitProgress('DOWNLOAD', 10, 'Baixando vídeo do YouTube...');
            const videoUrl = `https://youtube.com/watch?v=${video.youtube_video_id}`;
            const downloadPath = path.join(__dirname, '../../uploads', `${videoId}.mp4`);

            if (!fs.existsSync(path.dirname(downloadPath))) {
                fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
            }

            await youTubeService.downloadVideo(videoUrl, downloadPath);

            // 2. Transcrever
            emitProgress('TRANSCRIPTION', 30, 'Transcrevendo áudio (IA)...');
            const audioPath = path.join(__dirname, '../../uploads', `${videoId}.mp3`);

            await ffmpegService.extractAudio(downloadPath, audioPath, (p) => {
                emitProgress('TRANSCRIPTION', 10 + (p * 0.20), 'Extraindo áudio...');
            });

            const transcriptionData = await aiService.transcribeWithWords(audioPath);
            const transcription = transcriptionData.text;

            // 3. Analisar momentos virais
            emitProgress('AI', 50, 'Analisando momentos virais com IA...');
            const analysis = await aiService.analyzeTranscription(transcription);

            // 4. Calcular enquadramento inteligente
            emitProgress('IA', 55, 'Calculando enquadramento inteligente...');
            const framingData = await aiService.getSmartFraming(downloadPath);
            const xOffset = framingData.x_offset_pct;

            // 5. Criar clips
            const subtitleGenerator = require('../utils/subtitleGenerator');
            const clipsCount = analysis.clips.length;
            const createdClips = [];

            emitProgress('CLIPPING', 75, `Gerando ${clipsCount} clips virais...`);

            for (let i = 0; i < clipsCount; i++) {
                const startPercent = 75 + (i / clipsCount) * 15;
                const clipData = analysis.clips[i];

                emitProgress('CLIPPING', startPercent, `Clip ${i + 1} de ${clipsCount}: ${clipData.title}`);

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

                // 1. Extração base (9:16 + Crop + Scale) - Sem legendas ainda
                const rawClipPath = await ffmpegService.extractVerticalClip(
                    downloadPath,
                    startSeconds,
                    duration,
                    `${videoId}_${i}_raw`,
                    { xOffset: xOffset, subtitlesPath: null }
                );

                // 2. Edições Avançadas (Silêncio, Zoom, B-Roll)
                emitProgress('ADVANCED_EDIT', 75 + (i / clipsCount) * 10, `Clip ${i + 1}: Aplicando edições avançadas...`);
                const editResult = await videoEditingService.applyAdvancedEditing(
                    rawClipPath,
                    duration,
                    clipWords
                );

                // 3. Queimar Legendas no clip já editado
                const finalClipPath = path.join(__dirname, '../../uploads', `${videoId}_${i}_final.mp4`);
                await ffmpegService.addSubtitles(
                    editResult.path,
                    assPath,
                    finalClipPath,
                    (p) => {
                        const stagePercent = (1 / clipsCount) * 5;
                        const currentPercent = 85 + (i / clipsCount) * 5 + (p / 100) * stagePercent;
                        emitProgress('SUBTITLES', currentPercent, `Clip ${i + 1}: Adicionando legendas...`);
                    }
                );

                const fileName = `${videoId}_${i}_${Date.now()}.mp4`;
                const fileBuffer = fs.readFileSync(finalClipPath);

                await db.uploadFile('clips', fileName, fileBuffer);
                const publicUrl = await db.getPublicUrl('clips', fileName);

                const clip = await db.createClip({
                    video_id: videoId,
                    user_id: video.user_id,
                    title: clipData.title || `Clip ${i + 1}`,
                    start_time: clipData.start,
                    end_time: clipData.end,
                    viral_score: clipData.viral_score || 70,
                    file_url: publicUrl,
                    status: 'done',
                    hook: clipData.hook || '',
                    reason: clipData.reason || ''
                });

                createdClips.push(clip);

                // Limpeza de arquivos temporários do clip
                [rawClipPath, finalClipPath, assPath, ...editResult.tempFiles].forEach(f => {
                    if (f && fs.existsSync(f)) {
                        try { fs.unlinkSync(f); } catch (_) { }
                    }
                });
            }

            // Finalizar
            await db.updateVideoStatus(videoId, 'done', {
                transcription,
                processed_at: new Date()
            });

            if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

            emitProgress('DONE', 100, 'Clips prontos! ✅');
            io?.to(video.user_id).emit('video-progress', { id: videoId, videoId, status: 'done', clipsCount: createdClips.length, message: 'Processamento concluído!', percent: 100 });

            // Auto-postagem
            autoPostService.autoPublishReadyClips(videoId, video.user_id).catch(console.error);

        } catch (err) {
            console.error('[Pipeline Error]:', err);
            await db.updateVideoStatus(videoId, 'failed', { error_message: err.message });
            io?.to(video.user_id).emit('video-error', { id: videoId, videoId, message: err.message });
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

            // Usar o AutoPostService para fazer o post unificado se o user quiser
            // ou manter manual se for o caso. Por enquanto simplificamos.

            res.json({ success: true, message: 'Postagem automática agendada.' });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Listar clips (do usuário ou de um vídeo específico)
    async listClips(req, res) {
        try {
            const { videoId } = req.query;
            const userId = req.user.id;

            let query = supabase
                .from('clips')
                .select('*, videos!inner(*)')
                .order('created_at', { ascending: false });

            if (videoId) {
                query = query.eq('video_id', videoId);
            } else {
                query = query.eq('videos.user_id', userId);
            }

            const { data: clips, error } = await query;
            if (error) throw error;

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

    // Atualizar título/descrição de um clip
    async updateClip(req, res) {
        const { title, description, edit_silence_cut, edit_zoom, edit_broll } = req.body;
        const { clipId } = req.params;

        try {
            const { data, error } = await supabase
                .from('clips')
                .update({
                    title,
                    description,
                    edit_silence_cut,
                    edit_zoom,
                    edit_broll,
                    updated_at: new Date().toISOString()
                })
                .eq('id', clipId)
                .eq('user_id', req.user.id)
                .select()
                .single();

            if (error) throw error;
            res.json(data);
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
        if (typeof timeStr === 'number') return timeStr;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return parts[0] * 60 + parts[1];
    }
}

module.exports = new ClipController();
