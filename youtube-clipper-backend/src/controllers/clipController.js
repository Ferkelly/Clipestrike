const youTubeService = require('../services/youtubeService');
const ffmpegService = require('../services/ffmpegService');
const aiService = require('../services/aiService');
const videoEditingService = require('../services/videoEditingService');
const { db, supabase } = require('../config/database');
const path = require('path');
const fs = require('fs');
const os = require('os');
const autoPostService = require('../services/autoPostService');

class ClipController {
    /**
     * Entry point for processing a video that already exists in the database.
     */
    async processVideo(req, res) {
        const { videoId } = req.params;
        const userId = req.user.id;
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

            // Use saved options or defaults
            const options = video.processing_options || this._getDefaultOptions();

            // 1. Respond quickly to user
            res.json({ success: true, message: 'Processamento iniciado', videoId });

            // 2. Start background pipeline
            setImmediate(() => {
                this.runUnifiedPipeline(videoId, video, io, options).catch(err => {
                    console.error(`[Background Pipeline Error for ${videoId}]:`, err);
                });
            });

        } catch (error) {
            console.error('[ProcessVideo] Immediate error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Entry point for processing a video from a URL (starts search/import).
     */
    async processUrl(req, res) {
        const { url, type, options = {} } = req.body;
        const userId = req.user.id;
        const io = req.app.get('io');

        if (!url) return res.status(400).json({ error: 'URL é obrigatória.' });

        try {
            let youtubeVideoId;
            if (type === 'channel') {
                youtubeVideoId = await youTubeService.getLatestVideoFromChannel(url);
            } else {
                const ytIdMatch = url.match(/(?:v=|\/|embed\/|shorts\/)([0-9A-Za-z_-]{11})/);
                if (!ytIdMatch) return res.status(400).json({ error: 'URL do YouTube inválida.' });
                youtubeVideoId = ytIdMatch[1];
            }

            // Ensure manual channel exists
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

            // Find or create video
            let { data: video } = await supabase
                .from('videos')
                .select('*')
                .eq('youtube_video_id', youtubeVideoId)
                .eq('user_id', userId)
                .single();

            const mergedOptions = { ...this._getDefaultOptions(), ...options };

            if (!video) {
                video = await db.createVideo({
                    user_id: userId,
                    channel_id: channel.id,
                    youtube_video_id: youtubeVideoId,
                    title: 'Processando vídeo...',
                    status: 'pending',
                    source: 'manual',
                    processing_options: mergedOptions,
                    url: url.includes('youtube.com') ? url : `https://www.youtube.com/watch?v=${youtubeVideoId}`
                });
            } else {
                // Update options if provided
                await supabase.from('videos').update({ processing_options: mergedOptions }).eq('id', video.id);
            }

            // Immediate response
            res.json({ success: true, message: 'Processamento iniciado', videoId: video.id });

            // Background pipeline
            setImmediate(() => {
                this.runUnifiedPipeline(video.id, video, io, mergedOptions).catch(err => {
                    console.error(`[Background Pipeline Error for ${video.id}]:`, err);
                });
            });

        } catch (err) {
            console.error('[ProcessUrl Error]:', err);
            res.status(500).json({ error: err.message });
        }
    }

    /**
     * Unified Pipeline: The heavy lifting.
     */
    async runUnifiedPipeline(videoId, video, io, options) {
        const emitProgress = (step, percent, msg) => {
            console.log(`[Pipeline] [${videoId}] [${percent}%] ${msg}`);
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
            // Initial state update
            await db.updateVideoStatus(videoId, 'processing');
            emitProgress('START', 2, "Iniciando motores... 🚀");

            // 1. Resolve Source File
            let workingFilePath;
            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            if (video.source === 'manual_upload' && video.url && fs.existsSync(video.url)) {
                workingFilePath = video.url;
                emitProgress('UPLOAD', 10, "Arquivo local carregado ✅");
            } else {
                emitProgress('DOWNLOAD', 5, 'Baixando vídeo do YouTube...');
                const videoUrl = video.url || `https://youtube.com/watch?v=${video.youtube_video_id}`;
                workingFilePath = path.join(uploadsDir, `${videoId}_original.mp4`);

                // Do not re-download if exists and valid (cache)
                if (!fs.existsSync(workingFilePath)) {
                    await youTubeService.downloadVideo(videoUrl, workingFilePath);
                }
                emitProgress('DOWNLOAD', 20, "Download concluído ✅");
            }

            // 2. Audio & Transcription
            emitProgress('TRANSCRIPTION', 30, 'Transcrevendo áudio (IA)...');
            const audioPath = path.join(uploadsDir, `${videoId}.mp3`);

            await ffmpegService.extractAudio(workingFilePath, audioPath, (p) => {
                emitProgress('TRANSCRIPTION', 25 + (p * 0.10), 'Extraindo áudio...');
            });

            const transcriptionData = await aiService.transcribeWithWords(audioPath);
            const transcription = transcriptionData.text;
            emitProgress('TRANSCRIPTION', 45, 'Transcrição concluída ✅');

            // 3. AI Analysis
            emitProgress('AI', 50, 'Analisando momentos virais com IA...');
            const analysis = await aiService.analyzeTranscription(transcription);

            let clipsToProcess = analysis.clips || [];
            if (options.maxClips) {
                clipsToProcess = clipsToProcess.slice(0, options.maxClips);
            }
            emitProgress('AI', 55, `Identificados ${clipsToProcess.length} momentos promissores!`);

            // 4. Smart Framing (Optional but usually good)
            emitProgress('FRAMING', 58, 'Calculando enquadramento vertical...');
            const framingData = await aiService.getSmartFraming(workingFilePath);
            const xOffset = framingData.x_offset_pct || 0;

            // 5. Clipping Loop
            const subtitleGenerator = require('../utils/subtitleGenerator');
            const createdClips = [];

            for (let i = 0; i < clipsToProcess.length; i++) {
                const stagePercent = 60 + (i / clipsToProcess.length) * 35;
                const clipData = clipsToProcess[i];
                emitProgress('CLIPPING', stagePercent, `Processando clip ${i + 1} de ${clipsToProcess.length}...`);

                const startSeconds = this.timeToSeconds(clipData.start);
                const endSeconds = this.timeToSeconds(clipData.end);
                const duration = endSeconds - startSeconds;

                if (duration <= 0) continue;

                // Sync words for this specific clip
                const clipWords = transcriptionData.words.filter(w =>
                    w.start >= startSeconds && w.end <= endSeconds
                ).map(w => ({
                    ...w,
                    start: w.start - startSeconds,
                    end: w.end - startSeconds
                }));

                const assPath = path.join(uploadsDir, `${videoId}_${i}.ass`);
                subtitleGenerator.generateAss(clipWords, assPath);

                // Phase A: Base Crop
                const rawClipPath = await ffmpegService.extractVerticalClip(
                    workingFilePath,
                    startSeconds,
                    duration,
                    `${videoId}_${i}_raw`,
                    { xOffset, subtitlesPath: null }
                );

                // Phase B: Advanced Edits
                const editResult = await videoEditingService.applyAdvancedEditing(
                    rawClipPath,
                    duration,
                    clipWords,
                    {
                        edit_silence_cut: options.silenceCut,
                        edit_zoom: options.dynamicZoom,
                        edit_broll: options.broll
                    }
                );

                // Phase C: Burn Subtitles
                let finalPath = editResult.path;
                if (options.subtitles) {
                    const subtitledPath = path.join(uploadsDir, `${videoId}_${i}_final.mp4`);
                    await ffmpegService.addSubtitles(editResult.path, assPath, subtitledPath);
                    finalPath = subtitledPath;
                }

                // Phase D: Upload to Storage & DB
                const fileName = `${videoId}_clip_${i}_${Date.now()}.mp4`;
                const fileBuffer = fs.readFileSync(finalPath);
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
                    reason: clipData.reason || '',
                    edit_silence_cut: options.silenceCut,
                    edit_zoom: options.dynamicZoom,
                    edit_broll: options.broll
                });

                createdClips.push(clip);

                // Cleanup clip-specific files
                [rawClipPath, finalPath !== editResult.path ? finalPath : null, assPath, ...editResult.tempFiles].forEach(f => {
                    if (f && fs.existsSync(f)) try { fs.unlinkSync(f); } catch (_) { }
                });
            }

            // 6. Cleanup & Finalize
            await db.updateVideoStatus(videoId, 'done', {
                transcription,
                processed_at: new Date()
            });

            // Keep original if it was manual_upload for future use, otherwise cleanup
            if (video.source !== 'manual_upload') {
                if (fs.existsSync(workingFilePath)) fs.unlinkSync(workingFilePath);
            }
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

            emitProgress('DONE', 100, 'Processamento concluído com sucesso! ✅');

            if (options.autoPublish) {
                autoPostService.autoPublishReadyClips(videoId, video.user_id).catch(console.error);
            }

        } catch (err) {
            console.error(`[Pipeline Error for ${videoId}]:`, err);
            await db.updateVideoStatus(videoId, 'failed', { error_message: err.message });
            io?.to(video.user_id).emit('video-error', { id: videoId, videoId, message: err.message });
        }
    }

    _getDefaultOptions() {
        return {
            maxClips: 5,
            minDuration: 30,
            maxDuration: 60,
            silenceCut: true,
            dynamicZoom: true,
            broll: false,
            subtitles: true,
            subtitleStyle: 'hormozi',
            subtitleLang: 'pt',
            autoPublish: false
        };
    }

    timeToSeconds(timeStr) {
        if (typeof timeStr === 'number') return timeStr;
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return Number(timeStr) || 0;
    }

    // Helper methods for routes
    async listClips(req, res) {
        try {
            const { videoId } = req.query;
            const userId = req.user.id;
            let query = supabase.from('clips').select('*, videos!inner(*)').order('created_at', { ascending: false });
            if (videoId) query = query.eq('video_id', videoId);
            else query = query.eq('videos.user_id', userId);
            const { data: clips, error } = await query;
            if (error) throw error;
            res.json({ clips });
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    async getClip(req, res) {
        try {
            const { data, error } = await supabase.from('clips').select('*, videos(id, title, youtube_video_id, thumbnail)').eq('id', req.params.clipId).single();
            if (error) return res.status(404).json({ error: 'Clip não encontrado.' });
            res.json({ clip: data });
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    async updateClip(req, res) {
        try {
            const { data, error } = await supabase.from('clips').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.clipId).eq('user_id', req.user.id).select().single();
            if (error) throw error;
            res.json(data);
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    async deleteClip(req, res) {
        try {
            const { error } = await supabase.from('clips').delete().eq('id', req.params.clipId);
            if (error) throw error;
            res.json({ message: 'Clip deletado com sucesso.' });
        } catch (err) { res.status(500).json({ error: err.message }); }
    }
}

module.exports = new ClipController();
