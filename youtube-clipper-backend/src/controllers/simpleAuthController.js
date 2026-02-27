const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db, supabase } = require('../config/database');
const logger = require('../utils/logger');

// POST /api/auth/register → Registrar com email/senha
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' });
        }

        // Verificar se já existe
        const existing = await db.getUserByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Este email já está cadastrado.' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const user = await db.createUser({
            name,
            email,
            password_hash,
            avatar: null,
        });

        const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'clipstrike-secret-key-2026', {
            expiresIn: '7d',
        });

        res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        logger.error(`Register error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

// POST /api/auth/login → Login com email/senha
const emailLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        // Buscar usuário
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        if (!user.password_hash) {
            return res.status(401).json({ error: 'Esta conta usa login pelo Google.' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'clipstrike-secret-key-2026', {
            expiresIn: '7d',
        });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
    } catch (err) {
        logger.error(`Login error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { register, emailLogin };
