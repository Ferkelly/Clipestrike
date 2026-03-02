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

const { startMonitorCron } = require('./jobs/monitorCron');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [process.env.FRONTEND_URL || "http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000", "http://127.0.0.1:3000"],
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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// O cron será iniciado no server.js após o listen
// startMonitorCron();

module.exports = { app, httpServer };
