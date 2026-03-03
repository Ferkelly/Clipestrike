const { supabase } = require('../config/database');
const logger = require('../utils/logger');

// GET /api/user/settings → Obter configurações
const getSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // Se não existir, retornar default
        if (!data) {
            return res.json({
                notifications: {
                    clipGenerated: true,
                    newVideo: true,
                    errors: true,
                    newsletter: false
                },
                plan: 'free'
            });
        }

        res.json(data);
    } catch (err) {
        logger.error(`GetSettings error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/user/settings → Atualizar configurações
const updateSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notifications } = req.body;

        const { data, error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: userId,
                notifications,
                updated_at: new Date()
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, settings: data });
    } catch (err) {
        logger.error(`UpdateSettings error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getSettings, updateSettings };
