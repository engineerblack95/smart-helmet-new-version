// ==================================================
// Server Bootstrap
// ==================================================

import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import { initSocket } from './sockets/socketHandler.js';
import { completeStaleRides } from './services/sensorService.js';
import { RIDE_TIMEOUT_MS } from './utils/constants.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to app for controllers to use
app.set('io', io);

initSocket(io);

async function start() {
  try {
    await connectDatabase();

    server.listen(config.port, () => {
      logger.info(`🚀 Server running on http://localhost:${config.port}`);
      logger.info(`📡 Socket.IO ready`);
      logger.info(`🌐 CORS origin: ${config.cors.origin}`);
      logger.info(`🔧 Environment: ${config.nodeEnv}`);
    });

    // Background job: auto-complete stale rides
    setInterval(async () => {
      try {
        const count = await completeStaleRides(io);
        if (count > 0) logger.info(`🧹 Auto-completed ${count} stale ride(s)`);
      } catch (err) {
        logger.error(`Stale ride cleanup failed: ${err.message}`);
      }
    }, RIDE_TIMEOUT_MS);

  } catch (error) {
    logger.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// ---------- Graceful Shutdown ----------
async function shutdown(signal) {
  logger.info(`\n${signal} received. Shutting down...`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

start();