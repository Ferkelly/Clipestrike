import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: '*', // Adjust for production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
import authRoutes from './routes/auth.routes';

app.use('/api/auth', authRoutes);

// app.use('/api/channels', channelRoutes);
// app.use('/api/clips', clipRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/billing', billingRoutes);

export default app;
