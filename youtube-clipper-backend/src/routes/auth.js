const express = require('express');
const router = express.Router();
const { googleLogin, googleCallback, getMe, logout } = require('../controllers/authController');
const { register, emailLogin } = require('../controllers/simpleAuthController');
const { authenticate } = require('../middleware/auth');

// GET  /api/auth/google           → Iniciar OAuth
router.get('/google', googleLogin);
// GET  /api/auth/google/callback  → Callback
router.get('/google/callback', googleCallback);
// GET  /api/auth/me               → Usuário logado
router.get('/me', authenticate, getMe);
// POST /api/auth/logout
router.post('/logout', authenticate, logout);

// POST /api/auth/register → Registrar com email/senha
router.post('/register', register);
// POST /api/auth/login → Login com email/senha
router.post('/login', emailLogin);

module.exports = router;

