import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * Health & Readiness Probe
 * GET /api/health
 * Returns HTTP 200 when database is healthy, HTTP 503 when disconnected.
 */
router.get('/', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const statusCode = isDbConnected ? 200 : 503;

  const healthCheck = {
    status: isDbConnected ? 'success' : 'error',
    message: isDbConnected ? 'RoadRescue API is healthy and ready' : 'RoadRescue API is unavailable (database disconnected)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    database: {
      status: isDbConnected ? 'connected' : 'disconnected'
    }
  };

  res.status(statusCode).json(healthCheck);
});

export default router;
