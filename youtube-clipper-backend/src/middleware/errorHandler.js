const logger = require('../utils/logger');

/**
 * Middleware global de tratamento de erros.
 * Deve ser registrado após todas as rotas no app.js.
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    const isDev = process.env.NODE_ENV !== 'production';

    logger.error(`[${req.method}] ${req.path} → ${statusCode}: ${err.message}`, {
        stack: isDev ? err.stack : undefined,
        body: isDev ? req.body : undefined,
    });

    // Erros conhecidos do Supabase
    if (err.code === 'PGRST116') {
        return res.status(404).json({ error: 'Recurso não encontrado.' });
    }

    // Erros de validação
    if (err.name === 'ValidationError') {
        return res.status(422).json({ error: err.message, details: err.details });
    }

    // Erros de autenticação
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Não autorizado.' });
    }

    // Erro genérico
    res.status(statusCode).json({
        error: statusCode >= 500 ? 'Erro interno do servidor.' : err.message,
        ...(isDev && { stack: err.stack }),
    });
};

/**
 * Helper para criar erros com statusCode customizado
 */
const createError = (message, statusCode = 500) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
};

/**
 * Middleware para rotas não encontradas (404)
 */
const notFound = (req, res) => {
    res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
};

module.exports = { errorHandler, createError, notFound };
