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

        // Try to extract handle or ID from URL if provided
        if (channelIdOrUrl.includes('youtube.com')) {
            const handle = channelIdOrUrl.split('/').pop().replace('@', '');
            console.log(`[YouTubeService] Extracted handle: ${handle}`);
            const response = await youtube.channels.list({
                auth,
                part: 'snippet,statistics,contentDetails',
                forHandle: handle
            });
            // Return the item directly — shim already fetched full data via fallback
            const channel = response.data.items?.[0];
            console.log(`[YouTubeService] Found channel:`, channel?.snippet?.title || 'not found');
            if (!channel) {
                throw new Error('Canal não encontrado pelo handle.');
            }
            return channel;
        }

        // Direct channel ID lookup
        if (channelIdOrUrl) {
            const channelId = channelIdOrUrl.startsWith('UC') ? channelIdOrUrl : null;
            if (channelId) {
                const response = await youtube.channels.list({
                    auth,
                    part: 'snippet,statistics,contentDetails',
                    id: channelId
                });
                console.log(`[YouTubeService] channels.list by ID ${channelId} returned ${response.data.items?.length || 0} items`);
                return response.data.items?.[0] || null;
            }
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

    // Obter o vídeo mais recente de um canal (suporta URL ou ID)
    async getLatestVideoFromChannel(channelUrlOrId) {
        const channelId = await this._extractChannelId(channelUrlOrId);
        if (!channelId) throw new Error('Não foi possível identificar o ID do canal.');

        const videos = await this.getLatestVideos(channelId, new Date(0));
        if (!videos || videos.length === 0) {
            throw new Error('Nenhum vídeo encontrado para este canal.');
        }

        // Retorna o mais recente (getLatestVideos já ordena por data)
        return videos[0].id.videoId;
    }

    // Helper para extrair channelId de diversos formatos
    async _extractChannelId(urlOrId) {
        if (!urlOrId) return null;
        if (urlOrId.startsWith('UC') && urlOrId.length === 24) return urlOrId;

        // Formatos: 
        // @handle, /channel/UC..., /c/..., /user/...
        let handle = null;
        if (urlOrId.includes('@')) {
            handle = urlOrId.split('@').pop().split('/')[0].split('?')[0];
        } else if (urlOrId.includes('/channel/')) {
            return urlOrId.split('/channel/').pop().split('/')[0].split('?')[0];
        } else if (urlOrId.includes('/c/')) {
            handle = urlOrId.split('/c/').pop().split('/')[0].split('?')[0];
        } else if (urlOrId.includes('/user/')) {
            handle = urlOrId.split('/user/').pop().split('/')[0].split('?')[0];
        } else if (!urlOrId.includes('/')) {
            handle = urlOrId; // Assume handle se não tiver barra
        }

        if (handle) {
            const channel = await this.getChannelInfo(handle);
            return channel?.id || null;
        }

        return null;
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
