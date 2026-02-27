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

const videoMonitor = require('./jobs/videoMonitor');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(cors());
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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar monitor de vídeos
videoMonitor.start();

module.exports = { app, httpServer };
