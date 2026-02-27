const { youtube, oauth2Client } = require('../config/youtube');
const { db } = require('../config/database');
const axios = require('axios');

// Cache em memória: channelId → uploadsPlaylistId (não muda nunca)
const uploadsPlaylistCache = new Map();

class YouTubeService {
    // Obter info do canal pelo URL ou ID
    // Custo: 1 unidade (channels.list)
    async getChannelInfo(channelIdOrUrl, accessToken) {
        console.log(`[YouTubeService] getChannelInfo: ${channelIdOrUrl}`);
        const auth = accessToken ? accessToken : (process.env.YOUTUBE_API_KEY || oauth2Client);

        let channelId = channelIdOrUrl;

        // Try to extract handle or ID from URL if provided
        if (channelIdOrUrl.includes('youtube.com')) {
            const handle = channelIdOrUrl.split('/').pop().replace('@', '');
            console.log(`[YouTubeService] Extracted handle: ${handle}`);
            const response = await youtube.channels.list({
                auth,
                part: 'snippet,statistics,contentDetails',
                forHandle: handle
            });
            channelId = response.data.items?.[0]?.id;
            console.log(`[YouTubeService] Found channelId for handle: ${channelId}`);
            if (!channelId && !channelIdOrUrl.includes('/channel/')) {
                throw new Error('Canal não encontrado pelo handle.');
            }
        }

        if (channelId) {
            const response = await youtube.channels.list({
                auth,
                part: 'snippet,statistics,contentDetails',
                id: channelId
            });
            console.log(`[YouTubeService] channels.list by ID ${channelId} returned ${response.data.items?.length || 0} items`);
            return response.data.items?.[0];
        }

        return null;
    }

    // Obter uploads playlist ID do canal — cacheado (1 unidade apenas na 1ª vez)
    async getUploadsPlaylistId(youtubeChannelId) {
        if (uploadsPlaylistCache.has(youtubeChannelId)) {
            return uploadsPlaylistCache.get(youtubeChannelId);
        }
        const res = await youtube.channels.list({
            part: 'contentDetails',
            id: youtubeChannelId,
        });
        let playlistId = res.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        // Fallback determinístico (UC -> UU)
        if (!playlistId && youtubeChannelId.startsWith('UC')) {
            playlistId = youtubeChannelId.replace(/^UC/, 'UU');
            console.log(`[YouTubeService] Using deterministic uploads playlist ID: ${playlistId}`);
        }

        if (playlistId) uploadsPlaylistCache.set(youtubeChannelId, playlistId);
        return playlistId;
    }

    // Verificar novos vídeos via RSS — CUSTO 0 UNIDADES 🎉
    // Fallback: playlistItems.list — 1 unidade (nunca usa search.list = 100 unidades)
    async getLatestVideos(youtubeChannelId, publishedAfter, accessToken) {
        try {
            return await this._getLatestViaRSS(youtubeChannelId, publishedAfter);
        } catch {
            return await this._getLatestViaPlaylist(youtubeChannelId, publishedAfter);
        }
    }

    // RSS: 0 unidades de cota — grátis e sem autenticação
    async _getLatestViaRSS(youtubeChannelId, publishedAfter) {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${youtubeChannelId}`;
        const res = await axios.get(rssUrl, { timeout: 5000 });
        const xml = res.data;

        // Parse simples do XML (sem dependência extra)
        const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
        const afterTime = publishedAfter instanceof Date ? publishedAfter.getTime() : new Date(publishedAfter).getTime();

        return entries
            .map((m) => {
                const entry = m[1];
                const videoId = (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];
                const title = (entry.match(/<title>(.*?)<\/title>/) || [])[1];
                const pubStr = (entry.match(/<published>(.*?)<\/published>/) || [])[1];
                const thumb = (entry.match(/url="(https:\/\/i[^"]+)"/) || [])[1];
                if (!videoId || !pubStr) return null;
                const pubTime = new Date(pubStr).getTime();
                if (pubTime <= afterTime) return null;
                return {
                    id: { videoId },
                    snippet: {
                        title: title?.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
                        publishedAt: pubStr,
                        thumbnails: { high: { url: thumb || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` } },
                    },
                };
            })
            .filter(Boolean);
    }

    // Fallback: playlistItems.list — 1 unidade (vs 100 do search.list)
    async _getLatestViaPlaylist(youtubeChannelId, publishedAfter) {
        const playlistId = await this.getUploadsPlaylistId(youtubeChannelId);
        if (!playlistId) return [];

        const res = await youtube.playlistItems.list({
            part: 'contentDetails,snippet',
            playlistId,
            maxResults: 10,
        });

        const afterTime = publishedAfter instanceof Date ? publishedAfter.getTime() : new Date(publishedAfter).getTime();
        return (res.data.items || [])
            .filter((item) => new Date(item.snippet.publishedAt).getTime() > afterTime)
            .map((item) => ({
                id: { videoId: item.contentDetails.videoId },
                snippet: item.snippet,
            }));
    }

    // Obter detalhes do vídeo (duração, etc)
    async getVideoDetails(videoIds) {
        const response = await youtube.videos.list({
            part: 'contentDetails,statistics,snippet',
            id: videoIds.join(',')
        });

        return response.data.items;
    }

    // Download do vídeo (usando yt-dlp-exec)
    async downloadVideo(videoUrl, outputPath) {
        const ytDlpExec = require('yt-dlp-exec');

        try {
            await ytDlpExec(videoUrl, {
                output: outputPath,
                format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            });
            return outputPath;
        } catch (error) {
            throw new Error(`Falha ao baixar vídeo: ${error.message}`);
        }
    }

    // Upload para YouTube Shorts (opcional - se quiser reupload)
    async uploadShort(videoPath, title, description, tags, accessToken) {
        oauth2Client.setCredentials({ access_token: accessToken });

        const fileSize = require('fs').statSync(videoPath).size;

        const res = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title,
                    description,
                    tags,
                    categoryId: '22' // People & Blogs
                },
                status: {
                    privacyStatus: 'public',
                    selfDeclaredMadeForKids: false
                }
            },
            media: {
                body: require('fs').createReadStream(videoPath)
            }
        }, {
            onUploadProgress: (evt) => {
                const progress = (evt.bytesRead / fileSize) * 100;
                console.log(`${Math.round(progress)}% complete`);
            }
        });

        return res.data;
    }
}

module.exports = new YouTubeService();
