const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware de autenticação JWT.
 * Extrai o token do header Authorization: Bearer <token>
 * e injeta req.user com os dados do usuário.
 */
const authenticate = async (req, res, next) => {
    try {
        // Permitir requisições internas com chave secreta
        const internalKey = req.headers['x-internal-key'];
        if (internalKey === (process.env.INTERNAL_API_KEY || 'internal')) {
            return next();
        }

        const authHeader = req.headers.authorization;
        let token;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clipstrike-secret-key-2026');

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, avatar, google_id, created_at')
            .eq('id', decoded.sub)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Usuário não encontrado ou token inválido.' });
        }

        // Buscar plano do usuário
        const { data: settings } = await supabase
            .from('user_settings')
            .select('plan')
            .eq('user_id', user.id)
            .single();

        user.plan = settings?.plan || 'free';

        req.user = user;
        next();
    } catch (err) {
        logger.warn(`Auth falhou: ${err.message}`);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(401).json({ error: 'Token inválido.' });
    }
};

module.exports = { authenticate };
