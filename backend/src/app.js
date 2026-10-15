// ==================================================
// Express App Configuration
// ==================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { stream } from './utils/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import helmetRoutes from './routes/helmetRoutes.js';
import bikeRoutes from './routes/bikeRoutes.js';
import sensorRoutes from './routes/sensorRoutes.js';
import violationRoutes from './routes/violationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import simulatorRoutes from './routes/simulatorRoutes.js';

const app = express();

// ---------- Security & CORS ----------
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// ---------- Body Parsing ----------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------- Logging ----------
app.use(morgan(config.isProduction ? 'combined' : 'dev', { stream }));

// ---------- Health Check ----------
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Helmet Backend is running',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// ---------- API Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/helmets', helmetRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/sensor', sensorRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/simulator', simulatorRoutes);

// ---------- 404 + Error Handlers ----------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;