const { youtube, oauth2Client } = require('../config/youtube');
const { db } = require('../config/database');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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

    // Download do vídeo (usando yt-dlp do sistema)
    async downloadVideo(videoUrl, outputPath) {
        console.log(`[YouTubeService] Iniciando download: ${videoUrl}`);

        try {
            // Caminho fixo dos cookies na VPS (pode ser sobrescrito pelo .env)
            const cookiesPath = process.env.COOKIES_PATH ||
                "/root/Clipestrike/youtube-clipper-backend/cookies.txt";

            const cookiesFlag = fs.existsSync(cookiesPath)
                ? `--cookies "${cookiesPath}"`
                : "";

            if (!cookiesFlag) {
                console.warn("[Download] ⚠️ cookies.txt não encontrado em:", cookiesPath);
            } else {
                console.log("[Download] ✅ Usando cookies:", cookiesPath);
            }

            // Passa o Node.js como runtime JS para resolver o challenge do YouTube
            const nodePath = process.execPath; // ex: /usr/bin/node
            const jsRuntimes = `--js-runtimes "node:${nodePath}"`;

            const command = [
                "yt-dlp",
                `-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best/bestvideo+bestaudio"`,
                `--merge-output-format mp4`,
                `--no-playlist`,
                `--no-check-certificates`,
                cookiesFlag,
                jsRuntimes,
                `--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"`,
                `-o "${outputPath}"`,
                `"${videoUrl}"`,
            ].filter(Boolean).join(" ");

            console.log("[Download] Executando comando:", command);

            const { stdout, stderr } = await execAsync(command, {
                timeout: 30 * 60 * 1000, // 30 minutos
            });

            if (!fs.existsSync(outputPath)) {
                throw new Error("Download concluído mas arquivo não encontrado");
            }

            console.log("[Download] ✅ Concluído:", outputPath);
            return outputPath;
        } catch (error) {
            console.error(`[Download] ❌ Erro: ${error.message}`);
            throw new Error(`Falha ao baixar vídeo: ${error.message}`);
        }
    }

    // Faz upload do clip como YouTube Short (Direto)
    async uploadYouTubeShort(clipId, userId) {
        console.log(`[YouTubeService] Iniciando upload direto do clip ${clipId} para o usuário ${userId}`);
        const { supabase } = require('../config/database');

        // 1. Busca tokens do usuário
        const { data: conn, error: connError } = await supabase
            .from("platform_connections")
            .select("*")
            .eq("user_id", userId)
            .eq("platform", "youtube")
            .single();

        if (connError || !conn) {
            console.error(`[YouTubeService] Erro ao buscar conexão: ${connError?.message || 'Não conectado'}`);
            throw new Error("YouTube não conectado para este usuário");
        }

        // 2. Busca o clip
        const { data: clip, error: clipError } = await supabase
            .from("clips")
            .select("*")
            .eq("id", clipId)
            .single();

        if (clipError || !clip) {
            throw new Error("Clip não encontrado");
        }

        // 3. Configura OAuth com tokens salvos
        oauth2Client.setCredentials({
            access_token: conn.access_token,
            refresh_token: conn.refresh_token,
            expiry_date: conn.expires_at ? new Date(conn.expires_at).getTime() : undefined,
        });

        // Ouvinte para salvar novos tokens se houver refresh automático
        oauth2Client.on("tokens", async (tokens) => {
            if (tokens.access_token) {
                console.log(`[YouTubeService] Token renovado para ${userId}`);
                await supabase.from("platform_connections").update({
                    access_token: tokens.access_token,
                    expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
                }).eq("user_id", userId).eq("platform", "youtube");
            }
        });

        // 4. Download temporário se for URL remota (Supabase Storage)
        let filePath = clip.file_url;
        let tempFile = false;

        if (clip.file_url.startsWith("http")) {
            const axios = require('axios');
            const uploadsDir = path.join(__dirname, '../../uploads');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            const tempPath = path.join(uploadsDir, `temp_upload_${clipId}.mp4`);

            console.log(`[YouTubeService] Baixando clip do storage: ${clip.file_url}`);
            const response = await axios({
                method: 'get',
                url: clip.file_url,
                responseType: 'arraybuffer'
            });
            fs.writeFileSync(tempPath, Buffer.from(response.data));
            filePath = tempPath;
            tempFile = true;
        }

        try {
            console.log(`[YouTubeService] Inserindo vídeo no YouTube...`);
            // Upload para o YouTube
            const uploadRes = await youtube.videos.insert({
                part: ["snippet", "status"],
                requestBody: {
                    snippet: {
                        title: clip.hook || clip.title || "Clip viral ⚡ #shorts",
                        description: `${clip.hook || ""}\n\n#shorts #viral #clips #clipstrike`,
                        tags: ["shorts", "viral", "clips"],
                        categoryId: "22",
                    },
                    status: {
                        privacyStatus: "public",
                        selfDeclaredMadeForKids: false,
                    },
                },
                media: {
                    body: fs.createReadStream(filePath),
                },
            });

            const videoId = uploadRes.data.id;
            const videoUrl = `https://youtube.com/shorts/${videoId}`;

            // 5. Atualiza clip com resultado
            await supabase.from("clips").update({
                post_status: "posted",
                posted_platforms: ["youtube"],
                posted_at: new Date().toISOString(),
                post_results: { youtube: { videoId, url: videoUrl } },
            }).eq("id", clipId);

            console.log(`[YouTubeService] ✅ Publicado com sucesso: ${videoUrl}`);
            return videoUrl;

        } catch (err) {
            console.error(`[YouTubeService] Erro no upload:`, err.message);
            await supabase.from("clips").update({
                post_status: "failed",
                post_error: err.message
            }).eq("id", clipId);
            throw err;
        } finally {
            if (tempFile && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }
}

module.exports = new YouTubeService();
