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
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, avatar, google_id')
            .eq('id', decoded.sub)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Usuário não encontrado ou token inválido.' });
        }

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
