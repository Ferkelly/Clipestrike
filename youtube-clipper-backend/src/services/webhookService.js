const YoutubeNotifier = require("youtube-notification");
const { supabase } = require("../config/database");
const axios = require("axios");

const CALLBACK_URL = `${process.env.API_BASE_URL}/api/webhook/youtube`;
const SECRET = process.env.WEBHOOK_SECRET || "clipstrike-secret";

// Inicializa o notifier
const notifier = new YoutubeNotifier({
    hubCallback: CALLBACK_URL,
    secret: SECRET,
    middleware: true, // usar como middleware Express
    path: "/",
});

// Quando YouTube avisar de novo vídeo
notifier.on("notified", async (data) => {
    const { channel, video } = data;

    if (!channel || !video || !channel.id || !video.id) {
        console.warn("[Webhook] Notification recebida mas dados incompletos:", data);
        return;
    }

    console.log(`[Webhook] 🔔 Novo vídeo detectado!`);
    console.log(`  Canal:  ${channel.name} (${channel.id})`);
    console.log(`  Vídeo:  ${video.title} (${video.id})`);

    try {
        // Busca o canal no banco para saber qual usuário é dono
        const { data: channelRecord } = await supabase
            .from("channels")
            .select("id, user_id, title")
            .eq("youtube_channel_id", channel.id)
            .eq("is_active", true)
            .single();

        if (!channelRecord) {
            console.log(`[Webhook] Canal ${channel.id} não encontrado ou não monitorado`);
            return;
        }

        // Verifica se já foi importado
        const { data: existing } = await supabase
            .from("videos")
            .select("id")
            .eq("youtube_video_id", video.id)
            .eq("user_id", channelRecord.user_id)
            .single();

        if (existing) {
            console.log(`[Webhook] Vídeo ${video.id} já importado, pulando`);
            return;
        }

        // Cria o vídeo no banco
        const { db } = require("../config/database");
        const newVideo = await db.createVideo({
            user_id: channelRecord.user_id,
            channel_id: channelRecord.id,
            youtube_video_id: video.id,
            title: video.title,
            url: `https://www.youtube.com/watch?v=${video.id}`,
            status: "pending",
            source: "webhook",
        });

        // Dispara o pipeline de processamento internamente
        // Nota: O endpoint /api/videos/process deve existir e aceitar x-internal-key
        try {
            await axios.post(`${process.env.API_BASE_URL}/api/videos/process`, {
                videoId: newVideo.id,
                youtubeVideoId: video.id,
                userId: channelRecord.user_id,
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "x-internal-key": process.env.INTERNAL_API_KEY || "internal",
                }
            });
            console.log(`[Webhook] ✅ Pipeline iniciado para: "${video.title}"`);
        } catch (procErr) {
            console.error(`[Webhook] Erro ao disparar processamento:`, procErr.message);
        }

        // Atualiza last_video_id no canal
        await supabase
            .from("channels")
            .update({
                last_video_id: video.id,
                last_checked_at: new Date().toISOString(),
            })
            .eq("id", channelRecord.id);

    } catch (err) {
        console.error(`[Webhook] ❌ Erro:`, err.message);
    }
});

notifier.on("subscribe", (data) => {
    try {
        const channelId = (data && data.feed) ? data.feed.split("channel_id=")[1] : "unknown";
        console.log(`[Webhook] ✅ Inscrito no canal: ${channelId}`);
    } catch (err) {
        console.log(`[Webhook] Erro ao processar evento subscribe:`, err.message);
    }
});

notifier.on("unsubscribe", (data) => {
    try {
        const feed = (data && data.feed) ? data.feed : "unknown";
        console.log(`[Webhook] ❌ Desinscrito do canal: ${feed}`);
    } catch (err) {
        console.log(`[Webhook] Erro ao processar evento unsubscribe:`, err.message);
    }
});

// Inscreve o servidor para receber notificações de um canal
async function subscribeToChannel(youtubeChannelId) {
    if (!youtubeChannelId) return;
    notifier.subscribe(youtubeChannelId);
    console.log(`[Webhook] 📡 Inscrevendo no canal: ${youtubeChannelId}`);
}

// Cancela inscrição de um canal
async function unsubscribeFromChannel(youtubeChannelId) {
    if (!youtubeChannelId) return;
    notifier.unsubscribe(youtubeChannelId);
    console.log(`[Webhook] 🔕 Cancelando inscrição: ${youtubeChannelId}`);
}

// Re-inscreve todos os canais ativos ao subir o servidor
async function resubscribeAllChannels() {
    const { data: channels } = await supabase
        .from("channels")
        .select("youtube_channel_id, title")
        .eq("is_active", true);

    if (!channels?.length) {
        console.log("[Webhook] Nenhum canal para inscrever");
        return;
    }

    console.log(`[Webhook] 📡 Re-inscrevendo ${channels.length} canal(is)...`);
    for (const ch of channels) {
        notifier.subscribe(ch.youtube_channel_id);
        await new Promise(r => setTimeout(r, 500)); // delay entre inscrições
    }
}

// Renova inscrição de todos os canais ativos (YouTube expira em ~10 dias)
async function renewAllSubscriptions() {
    const { data: channels } = await supabase
        .from("channels")
        .select("youtube_channel_id, title")
        .eq("is_active", true);

    if (!channels?.length) {
        console.log("[Webhook] Nenhum canal para renovar");
        return;
    }

    console.log(`[Webhook] 🔄 Renovando ${channels.length} inscrição(ões)...`);

    for (const ch of channels) {
        try {
            notifier.subscribe(ch.youtube_channel_id);
            await new Promise(r => setTimeout(r, 300));
        } catch (err) {
            console.error(`[Webhook] ❌ Erro ao renovar ${ch.title}:`, err.message);
        }
    }

    // Atualiza a data da última renovação
    await supabase
        .from("system_config")
        .upsert({
            key: "webhook_last_renewal",
            value: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

    console.log(`[Webhook] ✅ Renovação concluída`);
}

module.exports = {
    notifier,
    subscribeToChannel,
    unsubscribeFromChannel,
    resubscribeAllChannels,
    renewAllSubscriptions
};
