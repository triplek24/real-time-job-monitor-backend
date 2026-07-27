import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import jobRoutes from './modules/jobs/job.routes';
import sseRoutes from './realtime/sse.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'https://real-time-job-monitor-seven.vercel.app/', // your actual Vercel production URL
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. Postman, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(helmet());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/events', sseRoutes);

// Error handler
app.use(errorHandler);

export default app;