const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const videoRoutes = require('./routes/videos');
const clipRoutes = require('./routes/clips');
const monitorRoutes = require('./routes/monitor');
const autoPostRoutes = require('./routes/autoPost');
const userRoutes = require('./routes/user');
const platformRoutes = require('./routes/platform');
const webhookRoutes = require('./routes/webhookRoutes');
const { notifier } = require('./services/webhookService');

const { startMonitorCron } = require('./jobs/monitorCron');

const app = express();
const httpServer = createServer(app);

// Configuração robusta de CORS
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://clipstrike.tech",
    "https://www.clipstrike.tech"
].filter(Boolean);

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

// Webhook YouTube (Obrigatório vir antes do express.json para evitar conflito de body)
app.use('/api/webhook/youtube', notifier.listener());

// Middleware
app.use(helmet());
app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sem origin (como mobile apps ou curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
            callback(null, true);
        } else {
            console.log("CORS Bloqueado para origin:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// Socket.io para updates em tempo real
app.set('io', io);

io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('join_channel', (channelId) => {
        socket.join(`channel_${channelId}`);
    });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/clips', clipRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/autopost', autoPostRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/user', userRoutes);
app.use('/api/webhook', webhookRoutes);

// Health check (Ambas as rotas para evitar erro 404)
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date(), environment: process.env.NODE_ENV });
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date(), environment: process.env.NODE_ENV });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: 'Algo deu errado!' });
});

// O cron será iniciado no server.js após o listen
// startMonitorCron();

module.exports = { app, httpServer };
