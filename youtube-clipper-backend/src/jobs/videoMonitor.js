const cron = require('node-cron');
const youTubeService = require('../services/youtubeService');
const { db, supabase } = require('../config/database');

class VideoMonitor {
    constructor() {
        this.isRunning = false;
    }

    start() {
        // Verificar a cada 5 minutos
        cron.schedule('*/5 * * * *', () => {
            this.checkForNewVideos();
        });

        console.log('Monitor de vídeos iniciado');
    }

    async checkForNewVideos() {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            const channels = await db.getAllActiveChannels();

            for (const channel of channels) {
                const lastCheck = new Date(channel.last_check || Date.now() - 86400000);

                try {
                    const newVideos = await youTubeService.getLatestVideos(
                        channel.youtube_channel_id,
                        lastCheck,
                        channel.access_token
                    );

                    for (const video of newVideos) {
                        // Verificar se já existe
                        const exists = await db.getVideoByYoutubeId(video.id.videoId);

                        if (!exists) {
                            // Salvar novo vídeo
                            await db.createVideo({
                                channel_id: channel.id,
                                youtube_video_id: video.id.videoId,
                                title: video.snippet.title,
                                description: video.snippet.description,
                                thumbnail_url: video.snippet.thumbnails.high?.url,
                                published_at: video.snippet.publishedAt,
                                status: 'pending'
                            });

                            console.log(`Novo vídeo detectado: ${video.snippet.title}`);
                        }
                    }

                    // Atualizar last_check
                    await supabase
                        .from('channels')
                        .update({ last_check: new Date() })
                        .eq('id', channel.id);

                } catch (error) {
                    console.error(`Erro ao verificar canal ${channel.id}:`, error);
                }
            }
        } catch (error) {
            console.error('Erro no monitor:', error);
        } finally {
            this.isRunning = false;
        }
    }
}

module.exports = new VideoMonitor();
