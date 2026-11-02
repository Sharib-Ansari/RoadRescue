import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// API Routes
app.use('/api/health', healthRoutes);

// Future route placeholders
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/mechanics', mechanicRoutes);
// app.use('/api/requests', requestRoutes);

// Handle undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
