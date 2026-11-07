import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './socket/index.js';

const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = '0.0.0.0';

let server = null;
let isShuttingDown = false;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB before accepting incoming traffic
    await connectDB();

    // 2. Create HTTP server and initialize Socket.IO
    server = createServer(app);
    initSocket(server);

    // 3. Start listening explicitly on 0.0.0.0 (required for Render and container runtimes)
    server.listen(PORT, HOST, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on ${HOST}:${PORT}`);
      console.log(`Health check: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/health`);
      console.log(`Socket.IO initialized on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

/**
 * Graceful Shutdown Handler
 * Safely closes HTTP server, active Socket.IO connections, and MongoDB connection
 */
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);

  // Force exit after 10s if graceful closure hangs
  const forceTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  try {
    // 1. Stop accepting new HTTP / WebSocket connections
    if (server) {
      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            console.error('Error closing HTTP server:', err.message);
          } else {
            console.log('HTTP and WebSocket server closed cleanly.');
          }
          resolve();
        });
      });
    }

    // 2. Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed cleanly.');
    }

    console.log('RoadRescue shutdown complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err.message);
    process.exit(1);
  }
};

// Process signal listeners for container orchestration (Render / Docker / Kubernetes)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
  gracefulShutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  gracefulShutdown('uncaughtException');
});

startServer();
