// ============================================================
// services/autoPostService.js
// Publica clips nas redes sociais via Upload-Post.com SDK (White-Label)
// ============================================================

const { UploadPost } = require("upload-post");
const { supabase } = require("../config/database");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const UPLOAD_POST_API = "https://api.upload-post.com/api/uploadposts";
const API_KEY = process.env.UPLOAD_POST_API_KEY;

/**
 * Gera um link de conexão personalizado (OAuth White-Label) para o usuário
 */
async function getConnectUrl(userId) {
    const username = `clipstrike_${userId}`;

    try {
        // 1. Criar perfil no Upload-Post (se não existir)
        await axios.post(`${UPLOAD_POST_API}/users`, { username }, {
            headers: { "Authorization": `ApiKey ${API_KEY}` }
        }).catch(err => {
            // Ignorar erro 409 (usuário já existe)
            if (err.response?.status !== 409) throw err;
        });

        // 2. Gerar JWT de acesso para esse usuário
        const jwtRes = await axios.post(`${UPLOAD_POST_API}/users/generate-jwt`, {
            username,
            redirect_url: `${process.env.FRONTEND_URL}/dashboard/plataformas?connected=true`,
            logo_image: "https://www.clipstrike.tech/logo.png",
            connect_title: "Conecte suas redes ao ClipStrike",
            connect_description: "Escolha as plataformas onde seus clips serão publicados automaticamente.",
        }, {
            headers: { "Authorization": `ApiKey ${API_KEY}` }
        });

        if (!jwtRes.data?.access_url) {
            throw new Error("Falha ao gerar URL de conexão");
        }

        // 3. Salvar username no banco para garantir
        await supabase
            .from("user_platform_configs")
            .upsert({
                user_id: userId,
                upload_post_username: username,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });

        return {
            connectUrl: jwtRes.data.access_url,
            expiresIn: jwtRes.data.duration
        };
    } catch (err) {
        console.error("[AutoPostService] Error in getConnectUrl:", err.message);
        throw err;
    }
}

/**
 * Busca o status das contas sociais conectadas no Upload-Post
 */
async function getPlatformStatus(userId) {
    const username = `clipstrike_${userId}`;

    try {
        const profileRes = await axios.get(`${UPLOAD_POST_API}/users/${username}`, {
            headers: { "Authorization": `ApiKey ${API_KEY}` },
        });

        const profile = profileRes.data;
        const socialAccounts = profile.profile?.social_accounts || {};

        return {
            connected: true,
            platforms: socialAccounts,
            uploadPostUser: username
        };
    } catch (err) {
        if (err.response?.status === 404) {
            return { connected: false, platforms: {} };
        }
        console.error("[AutoPostService] Error in getPlatformStatus:", err.message);
        throw err;
    }
}

/**
 * Publica um clip em múltiplas plataformas usando o Upload-Post.com
 */
async function publishClip(options) {
    const {
        clipId,
        clipFilePath,
        title,
        platforms,
        uploadPostUser, // Agora usamos o upload_post_username (clipstrike_ID)
        scheduledDate,
    } = options;

    console.log(`[AutoPost] 🚀 Publicando clip "${title}" em: ${platforms.join(", ")}`);

    if (!fs.existsSync(clipFilePath)) {
        throw new Error(`Arquivo não encontrado: ${clipFilePath}`);
    }

    const client = new UploadPost(API_KEY);
    const results = [];

    try {
        await supabase
            .from("clips")
            .update({ post_status: "posting" })
            .eq("id", clipId);

        const response = await client.upload(clipFilePath, {
            title,
            user: uploadPostUser,
            platforms,
            tiktokPrivacyLevel: "PUBLIC_TO_EVERYONE",
            ...(scheduledDate && {
                scheduledDate,
                timezone: "America/Sao_Paulo",
            }),
        });

        console.log(`[AutoPost] ✅ Upload concluído:`, response);

        for (const platform of platforms) {
            results.push({
                platform,
                success: true,
                postUrl: response?.[platform]?.url || null,
            });
        }

        await supabase
            .from("clips")
            .update({
                post_status: "posted",
                post_results: results,
                posted_at: new Date().toISOString(),
                posted_platforms: platforms,
            })
            .eq("id", clipId);

    } catch (err) {
        console.error(`[AutoPost] ❌ Erro ao publicar:`, err.message);

        for (const platform of platforms) {
            results.push({
                platform,
                success: false,
                error: err.message,
            });
        }

        await supabase
            .from("clips")
            .update({
                post_status: "post_failed",
                post_error: err.message,
                post_results: results,
            })
            .eq("id", clipId);
    }

    return results;
}

/**
 * Publica automaticamente todos os clips prontos de um vídeo
 */
async function autoPublishReadyClips(videoId, userId) {
    console.log(`[AutoPost] 📋 Verificando clips prontos para auto-post (Video: ${videoId})...`);

    const { data: clips, error } = await supabase
        .from("clips")
        .select("*")
        .eq("video_id", videoId)
        .eq("status", "done")
        .is("post_status", null);

    if (error || !clips?.length) {
        console.log(`[AutoPost] 📭 Nenhum clip pronto para publicar`);
        return;
    }

    const { data: userConfig } = await supabase
        .from("user_platform_configs")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (!userConfig || !userConfig.upload_post_username || !userConfig.enabled_platforms?.length) {
        console.log(`[AutoPost] ⚠️ Usuário não configurado para auto-post`);
        return;
    }

    if (userConfig.auto_post === false) {
        console.log(`[AutoPost] ⏸ Auto-post desativado para o usuário`);
        return;
    }

    // 1. Verificação de Conexão Direta (YouTube)
    const youtubeService = require('./youtubeService');
    const { data: directConn } = await supabase
        .from("platform_connections")
        .select("id")
        .eq("user_id", userId)
        .eq("platform", "youtube")
        .single();

    for (const clip of clips) {
        try {
            // Se tiver conexão direta com YouTube, posta por lá também
            if (directConn) {
                console.log(`[AutoPost] 🎯 Detectada conexão direta YouTube. Postando clip ${clip.id}...`);
                youtubeService.uploadYouTubeShort(clip.id, userId).catch(err => {
                    console.error(`[AutoPost] Erro no upload direto YouTube:`, err.message);
                });
            }

            // Lógica antiga do Upload-Post (mantida como fallback ou para outras redes)
            if (userConfig && userConfig.upload_post_username && userConfig.enabled_platforms?.length && userConfig.auto_post !== false) {
                let filePath;
                if (clip.file_url && clip.file_url.startsWith("http")) {
                    filePath = await downloadClipToTemp(clip.file_url, clip.id);
                } else if (clip.file_url) {
                    filePath = path.resolve(clip.file_url);
                }

                if (filePath) {
                    await publishClip({
                        clipId: clip.id,
                        clipFilePath: filePath,
                        title: clip.hook || clip.title || "Clip automático ⚡",
                        platforms: userConfig.enabled_platforms,
                        uploadPostUser: userConfig.upload_post_username,
                    });

                    if (clip.file_url.startsWith("http") && fs.existsSync(filePath)) {
                        try { fs.unlinkSync(filePath); } catch (e) { }
                    }
                }
            }

            await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
            console.error(`[AutoPost] Erro no loop de auto-post:`, err.message);
        }
    }
}

async function downloadClipToTemp(url, clipId) {
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const tempPath = path.join(uploadsDir, `temp_post_${clipId}.mp4`);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);
        writer.on('finish', () => resolve(tempPath));
        writer.on('error', reject);
    });
}

module.exports = {
    getConnectUrl,
    getPlatformStatus,
    publishClip,
    autoPublishReadyClips,
    downloadClipToTemp
};
