import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import mechanicRoutes from './routes/mechanicRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Trust reverse proxy (Render / Cloud load balancer) for accurate IP resolution in rate limiting
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

/**
 * CORS — allow credentialed requests from the configured frontend origins.
 *
 * FRONTEND_URL can be a single origin or a comma-separated list, e.g.:
 *   FRONTEND_URL=https://road-rescue-omega.vercel.app
 * or:
 *   FRONTEND_URL=https://road-rescue-omega.vercel.app,http://localhost:5173
 *
 * Each origin is trimmed and trailing slashes are removed before comparison.
 */
const rawAllowedOrigins = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = rawAllowedOrigins
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow server-to-server requests (no Origin header) and known origins
      if (!requestOrigin) return callback(null, true);
      const normalised = requestOrigin.trim().replace(/\/$/, '');
      if (allowedOrigins.includes(normalised)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${requestOrigin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for reading HttpOnly JWT cookies
app.use(cookieParser());

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', dashboardRoutes);

// Handle undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
