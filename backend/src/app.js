import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import slotRoutes from './routes/slotRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import canteenRoutes from './routes/canteenRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5500',
  ...(process.env.FRONTEND_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean),
  ...(process.env.FRONTEND_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean)
]);

app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'QueueBite Full-Stack API'
  });
});

// Mount modular API groups under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/slots', slotRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/canteen', canteenRoutes);

// Fallback for 404
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use(errorHandler);

export default app;
