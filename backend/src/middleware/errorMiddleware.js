// ==================================================
// Error Handling Middleware
// ==================================================

import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

// ---------- 404 NOT FOUND ----------
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// ---------- GLOBAL ERROR HANDLER ----------
export function errorHandler(err, req, res, next) {
  logger.error(`${err.message} — ${req.method} ${req.originalUrl}`);
  if (!config.isProduction) {
    logger.error(err.stack);
  }

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.isDevelopment && { stack: err.stack }),
  });
}