// ============================================================
// services/autoPostService.js
// Publica clips nas redes sociais via Upload-Post.com SDK
// ============================================================

const { UploadPost } = require("upload-post");
const { supabase } = require("../config/database");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

/**
 * Publica um clip em múltiplas plataformas usando o Upload-Post.com
 */
async function publishClip(options) {
    const {
        clipId,
        clipFilePath,
        title,
        platforms,
        uploadPostUser,
        scheduledDate,
    } = options;

    console.log(`[AutoPost] 🚀 Publicando clip "${title}" em: ${platforms.join(", ")}`);

    // Valida que o arquivo existe
    if (!fs.existsSync(clipFilePath)) {
        throw new Error(`Arquivo não encontrado: ${clipFilePath}`);
    }

    // Inicializa o cliente Upload-Post com a API key do .env
    const client = new UploadPost(process.env.UPLOAD_POST_API_KEY);

    const results = [];

    try {
        // Atualiza status no Supabase para 'posting'
        await supabase
            .from("clips")
            .update({ post_status: "posting" })
            .eq("id", clipId);

        // Faz o upload para todas as plataformas de uma vez
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

        // Monta resultado por plataforma
        for (const platform of platforms) {
            results.push({
                platform,
                success: true,
                postUrl: response?.[platform]?.url || null,
            });
        }

        // Salva resultado no Supabase
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
                post_status: "failed",
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

    // Busca clips prontos que ainda não foram publicados
    const { data: clips, error } = await supabase
        .from("clips")
        .select("*")
        .eq("video_id", videoId)
        .eq("status", "ready") // 'ready' é o status final no banco atual
        .is("post_status", null);

    if (error || !clips?.length) {
        console.log(`[AutoPost] 📭 Nenhum clip pronto para publicar`);
        return;
    }

    // Busca configuração de plataformas do usuário
    const { data: userConfig } = await supabase
        .from("user_platform_configs")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (!userConfig || !userConfig.up_username || !userConfig.platforms?.length) {
        console.log(`[AutoPost] ⚠️  Usuário não tem plataformas configuradas ou auto_post desligado`);
        return;
    }

    // Só publica se o auto_post estiver ligado
    if (!userConfig.auto_post) {
        console.log(`[AutoPost] ⏸ Auto-post desativado para o usuário`);
        return;
    }

    for (const clip of clips) {
        try {
            // Resolve o caminho do arquivo (se for URL, baixa)
            let filePath;
            if (clip.file_url && clip.file_url.startsWith("http")) {
                filePath = await downloadClipToTemp(clip.file_url, clip.id);
            } else if (clip.file_url) {
                filePath = path.resolve(clip.file_url);
            } else {
                console.log(`[AutoPost] ⏭ Clip ${clip.id} sem URL de arquivo`);
                continue;
            }

            await publishClip({
                clipId: clip.id,
                clipFilePath: filePath,
                title: clip.hook || clip.title || "Clip gerado por ClipStrike",
                platforms: userConfig.platforms,
                uploadPostUser: userConfig.up_username,
            });

            // Limpa arquivo temporário se foi baixado
            if (clip.file_url.startsWith("http") && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            // Delay entre posts
            await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
            console.error(`[AutoPost] Erro no loop de auto-post:`, err.message);
        }
    }
}

/**
 * Download temporário se o clip estiver no Cloud Storage
 */
async function downloadClipToTemp(url, clipId) {
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

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
    publishClip,
    autoPublishReadyClips
};
