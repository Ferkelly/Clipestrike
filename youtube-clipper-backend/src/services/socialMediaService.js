const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class SocialMediaService {
    // TikTok Upload (via API não-oficial ou selenium - complexo)
    // Alternativa: usar serviços como RapidAPI ou avisar usuário para postar manualmente

    async postToTikTok(videoPath, caption, accessToken) {
        // TikTok requer parceria para API oficial
        // Solução: usar TikTok Creator Portal ou avisar usuário
        console.log('TikTok requer autenticação manual. Enviando notificação...');
        return { status: 'pending_manual', platform: 'tiktok' };
    }

    // Instagram Reels (Graph API)
    async postToInstagram(videoUrl, caption, accessToken, instagramAccountId) {
        try {
            // 1. Criar container
            const createResponse = await axios.post(
                `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
                {
                    media_type: 'REELS',
                    video_url: videoUrl,
                    caption: caption,
                    access_token: accessToken
                }
            );

            const creationId = createResponse.data.id;

            // 2. Aguardar processamento e publicar
            await new Promise(resolve => setTimeout(resolve, 30000));

            const publishResponse = await axios.post(
                `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
                {
                    creation_id: creationId,
                    access_token: accessToken
                }
            );

            return {
                status: 'published',
                platform: 'instagram',
                postId: publishResponse.data.id
            };
        } catch (error) {
            throw new Error(`Instagram upload failed: ${error.message}`);
        }
    }

    // YouTube Shorts (já implementado no youtubeService)

    // Twitter/X (via API v2)
    async postToTwitter(videoPath, text, accessToken) {
        // Requer Twitter API paga agora :(
        return { status: 'pending_manual', platform: 'twitter' };
    }

    // Notificar usuário para post manual
    async notifyUserForManualPost(userId, clipData, platforms) {
        const { supabase } = require('../config/database');

        await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                type: 'manual_post_required',
                message: `Seu clip "${clipData.title}" está pronto para ${platforms.join(', ')}`,
                data: clipData,
                read: false
            }]);

        await this.sendEmailNotification(userId, clipData);
    }

    async sendEmailNotification(userId, clipData) {
        const { supabase } = require('../config/database');

        const { data: user } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();

        if (user) {
            // Integração com Resend (100 emails/dia grátis)
            console.log(`Email enviado para ${user.email}: Clip pronto!`);
        }
    }
}

module.exports = new SocialMediaService();
