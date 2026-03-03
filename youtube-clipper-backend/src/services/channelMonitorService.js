const { supabase } = require('../config/database');
const youtubeService = require('./youtubeService');
const axios = require('axios');

const YT_API_KEY = process.env.YOUTUBE_API_KEY;
const API_BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || "internal";

/**
 * Service to monitor YouTube channels and trigger the processing pipeline.
 */
class ChannelMonitorService {

    // ── Verifica se o vídeo já foi importado ──────────────────────────────────
    async videoAlreadyImported(youtubeVideoId) {
        const { data, error } = await supabase
            .from("videos")
            .select("id")
            .eq("youtube_video_id", youtubeVideoId)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return !!data;
    }

    // ── Dispara o pipeline de processamento via API interna ───────────────────
    async triggerProcessing(youtubeVideoId, userId, channelId, title, thumbnail) {
        console.log(`[Monitor] 🚀 Disparando pipeline para: "${title}"`);

        try {
            // Cria o registro do vídeo no banco com status pending
            const { data: video, error } = await supabase
                .from("videos")
                .insert({
                    user_id: userId,
                    channel_id: channelId,
                    youtube_video_id: youtubeVideoId,
                    title,
                    thumbnail_url: thumbnail,
                    status: "pending",
                    source: "auto_monitor",
                    published_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error || !video) {
                throw new Error(`Erro ao inserir vídeo: ${error?.message}`);
            }

            // Chama a rota de processamento existente no backend
            const res = await axios.post(`${API_BASE}/api/videos/${video.id}/process`,
                {
                    youtubeVideoId: youtubeVideoId,
                    userId,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-internal-key": INTERNAL_KEY
                    }
                }
            );

            console.log(`[Monitor] ✅ Pipeline iniciado para vídeo DB id=${video.id}`);
            return video;
        } catch (err) {
            console.error(`[Monitor] ❌ Erro ao disparar processo para ${youtubeVideoId}:`, err.message);
            throw err;
        }
    }

    // ── Verifica um canal específico ──────────────────────────────────────────
    async checkChannel(channel) {
        console.log(`[Monitor] 🔍 Verificando canal: ${channel.title || channel.name} (ID: ${channel.youtube_channel_id})`);
        let newVideosFound = 0;

        try {
            // Busca vídeos publicados depois do último check
            const publishedAfter = channel.last_checked_at
                ? new Date(channel.last_checked_at)
                : new Date(Date.now() - 24 * 60 * 60 * 1000);

            const videos = await youtubeService.getLatestVideos(channel.youtube_channel_id, publishedAfter);

            if (!videos || videos.length === 0) {
                console.log(`[Monitor] ☕ Sem novos vídeos para ${channel.title || channel.name}`);
            } else {
                for (const videoData of videos) {
                    const videoId = videoData.id.videoId;
                    const title = videoData.snippet.title;
                    const thumbnail = videoData.snippet.thumbnails?.high?.url;

                    if (await this.videoAlreadyImported(videoId)) {
                        console.log(`[Monitor] ⏭ Vídeo já importado: ${title}`);
                        continue;
                    }

                    console.log(`[Monitor] 🆕 Novo vídeo detectado: "${title}"`);
                    await this.triggerProcessing(videoId, channel.user_id, channel.id, title, thumbnail);
                    newVideosFound++;
                }
            }

            // Atualiza last_checked_at e status
            await supabase
                .from("channels")
                .update({
                    last_checked_at: new Date().toISOString(),
                    status: "monitoring",
                    last_error: null
                })
                .eq("id", channel.id);

        } catch (err) {
            console.error(`[Monitor] ❌ Erro ao verificar ${channel.title || channel.name}:`, err.message);
            await supabase
                .from("channels")
                .update({ status: "error", last_error: err.message })
                .eq("id", channel.id);
        }

        return newVideosFound;
    }

    // ── Executa o monitoramento de TODOS os canais ativos ────────────────────
    async runChannelMonitor() {
        console.log("\n[Monitor] ═══════════════════════════════════");
        console.log("[Monitor] ⚡ Iniciando ciclo de monitoramento");
        console.log(`[Monitor] 🕐 ${new Date().toLocaleString("pt-BR")}`);

        try {
            // Busca todos os canais ativos no Supabase
            // is_active é o campo antigo, status: 'monitoring' é o novo
            const { data: channels, error } = await supabase
                .from("channels")
                .select("*")
                .or('status.eq.monitoring,is_active.eq.true')
                .order("last_checked_at", { ascending: true, nullsFirst: true });

            if (error) throw error;
            if (!channels || channels.length === 0) {
                console.log("[Monitor] 📭 Nenhum canal ativo para monitorar");
                return;
            }

            console.log(`[Monitor] 📺 ${channels.length} canal(is) para verificar`);

            let totalNew = 0;
            for (const channel of channels) {
                const found = await this.checkChannel(channel);
                totalNew += found;
                await new Promise(r => setTimeout(r, 2000));
            }

            console.log(`[Monitor] ✅ Ciclo concluído — ${totalNew} novo(s) vídeo(s) detectado(s)`);
        } catch (err) {
            console.error("[Monitor] 💥 Erro crítico no monitor:", err.message);
        }

        console.log("[Monitor] ═══════════════════════════════════\n");
    }
}

module.exports = new ChannelMonitorService();
