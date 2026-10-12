// ==================================================
// Socket.IO Handler
// ==================================================

import { SOCKET_EVENTS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

export function initSocket(io) {
  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.JOIN_HELMET, (helmetCode) => {
      socket.join(`helmet:${helmetCode}`);
      logger.info(`📡 ${socket.id} joined helmet:${helmetCode}`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_HELMET, (helmetCode) => {
      socket.leave(`helmet:${helmetCode}`);
      logger.info(`📴 ${socket.id} left helmet:${helmetCode}`);
    });

    socket.on('disconnect', () => {
      logger.info(`❌ Socket disconnected: ${socket.id}`);
    });
  });
}