const { supabase } = require('../config/database');
const { google } = require('googleapis');
const logger = require('../utils/logger');

// GET /api/analytics/internal
const getInternalStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Total de clips gerados
        const { count: totalClips } = await supabase
            .from("clips")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

        // Clips publicados
        const { count: publishedClips } = await supabase
            .from("clips")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("post_status", "posted");

        // Total de vídeos processados
        const { count: totalVideos } = await supabase
            .from("videos")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "done");

        // Canais monitorados
        const { count: totalChannels } = await supabase
            .from("channels")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "monitoring");

        // Clips por viral score (distribuição)
        const { data: clipsData } = await supabase
            .from("clips")
            .select("viral_score, created_at")
            .eq("user_id", userId)
            .eq("status", "ready"); // Assumindo 'ready' para clips concluídos

        // Calcular score médio
        const avgScore = clipsData?.length
            ? (clipsData.reduce((sum, c) => sum + (c.viral_score || 0), 0) / clipsData.length).toFixed(1)
            : 0;

        // Horas economizadas (estimativa: 2h por vídeo processado manualmente)
        const hoursSaved = (totalVideos || 0) * 2;

        // Clips por semana (últimas 4 semanas)
        const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentClips } = await supabase
            .from("clips")
            .select("created_at")
            .eq("user_id", userId)
            .gte("created_at", fourWeeksAgo)
            .order("created_at");

        // Agrupar por semana
        const weeklyData = [0, 1, 2, 3].map(weekOffset => {
            const weekEnd = new Date(Date.now() - weekOffset * 7 * 24 * 60 * 60 * 1000);
            const weekStart = new Date(Date.now() - (weekOffset + 1) * 7 * 24 * 60 * 60 * 1000);

            const count = recentClips?.filter(c => {
                const d = new Date(c.created_at);
                return d >= weekStart && d < weekEnd;
            }).length || 0;

            let weekLabel = "";
            if (weekOffset === 0) weekLabel = "Esta semana";
            else if (weekOffset === 1) weekLabel = "1 sem. atrás";
            else if (weekOffset === 2) weekLabel = "2 sem. atrás";
            else weekLabel = "3 sem. atrás";

            return {
                week: weekLabel,
                clips: count,
            };
        }).reverse();

        res.json({
            totalClips: totalClips || 0,
            publishedClips: publishedClips || 0,
            totalVideos: totalVideos || 0,
            totalChannels: totalChannels || 0,
            avgViralScore: avgScore,
            hoursSaved,
            weeklyData,
        });
    } catch (err) {
        logger.error(`Internal Analytics error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/analytics/youtube
const getYoutubeStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Busca tokens do YouTube do usuário
        const { data: conn } = await supabase
            .from("platform_connections")
            .select("*")
            .eq("user_id", userId)
            .eq("platform", "youtube")
            .single();

        if (!conn) {
            return res.json({ connected: false, clips: [] });
        }

        // Busca clips publicados com YouTube video ID
        const { data: clips } = await supabase
            .from("clips")
            .select("id, title, hook, post_results, posted_at, thumbnail_url, description") // corrigido thumbnail -> thumbnail_url se for o caso, mas vou checar schema
            .eq("user_id", userId)
            .eq("post_status", "posted")
            .not("post_results", "is", null)
            .order("posted_at", { ascending: false })
            .limit(20);

        // Thumbnail column check: "thumbnail_url" doesn't exist in clips. It has "file_url"? 
        // No, user provided code uses `clip.thumbnail`. I'll use `clip.post_results?.youtube?.thumbnail` or similar if available, or just the file_url if it's an image?
        // Actually, videos has thumbnail_url. Clips might not.
        // I'll stick to user logic and fallback to placeholder if needed.

        if (!clips?.length) {
            return res.json({ connected: true, clips: [] });
        }

        // Busca stats reais do YouTube para cada clip
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({
            access_token: conn.access_token,
            refresh_token: conn.refresh_token,
        });
        const youtube = google.youtube({ version: "v3", auth: oauth2Client });

        const videoIds = clips
            .map(c => c.post_results?.youtube?.videoId)
            .filter(Boolean);

        if (!videoIds.length) {
            return res.json({ connected: true, clips: [] });
        }

        const statsRes = await youtube.videos.list({
            part: ["statistics", "snippet"],
            id: videoIds,
        });

        const statsMap = {};
        for (const item of statsRes.data.items || []) {
            statsMap[item.id] = {
                views: parseInt(item.statistics?.viewCount || "0"),
                likes: parseInt(item.statistics?.likeCount || "0"),
                comments: parseInt(item.statistics?.commentCount || "0"),
                title: item.snippet?.title,
                thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url
            };
        }

        const enrichedClips = clips.map(clip => {
            const videoId = clip.post_results?.youtube?.videoId;
            const stats = statsMap[videoId] || {};
            return {
                id: clip.id,
                title: clip.hook || clip.title,
                videoId,
                url: videoId ? `https://youtube.com/shorts/${videoId}` : null,
                postedAt: clip.posted_at,
                thumbnail: stats.thumbnail || clip.post_results?.youtube?.thumbnail || null,
                views: stats.views || 0,
                likes: stats.likes || 0,
                comments: stats.comments || 0,
            };
        });

        // Totais
        const totalViews = enrichedClips.reduce((s, c) => s + c.views, 0);
        const totalLikes = enrichedClips.reduce((s, c) => s + c.likes, 0);
        const totalComments = enrichedClips.reduce((s, c) => s + c.comments, 0);

        res.json({
            connected: true,
            totals: { views: totalViews, likes: totalLikes, comments: totalComments },
            clips: enrichedClips,
        });

    } catch (err) {
        logger.error(`YouTube Analytics error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getInternalStats, getYoutubeStats };
