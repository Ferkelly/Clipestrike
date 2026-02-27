const jwt = require('jsonwebtoken');
const { oauth2Client } = require('../config/youtube');
const { db } = require('../config/database');
const logger = require('../utils/logger');

// GET /api/auth/google → Redirecionar para OAuth Google
const googleLogin = (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/youtube.upload',
            'openid',
            'email',
            'profile',
        ],
        prompt: 'consent',
    });
    res.redirect(url);
};

// GET /api/auth/google/callback → Callback OAuth
const googleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).json({ error: 'Código OAuth não fornecido.' });

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Obter perfil do usuário
        const { google } = require('googleapis');
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: profile } = await oauth2.userinfo.get();

        // Upsert usuário no banco
        let user = await db.getUserByEmail(profile.email);
        if (!user) {
            user = await db.createUser({
                email: profile.email,
                name: profile.name,
                avatar: profile.picture,
                google_id: profile.id,
                youtube_access_token: tokens.access_token,
                youtube_refresh_token: tokens.refresh_token,
            });
        }

        const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        });

        res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
    } catch (err) {
        logger.error(`OAuth callback error: ${err.message}`);
        res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
};

// GET /api/auth/me → Dados do usuário logado
const getMe = (req, res) => {
    res.json({ user: req.user });
};

// POST /api/auth/logout
const logout = (req, res) => {
    res.json({ message: 'Logout realizado com sucesso.' });
};

module.exports = { googleLogin, googleCallback, getMe, logout };
