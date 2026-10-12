// ==================================================
// Sensor Routes
// ==================================================
// POST /data uses x-api-key (device auth)
// All other routes use JWT (user auth)
// ==================================================

import express from 'express';
import { body } from 'express-validator';
import * as sensorController from '../controllers/sensorController.js';
import { authenticate, authenticateDevice } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

// ---------- IoT ingestion (API KEY) ----------
router.post(
  '/data',
  authenticateDevice,
  [
    body('helmetCode').trim().notEmpty().withMessage('helmetCode is required'),
    body('bikeCode').trim().notEmpty().withMessage('bikeCode is required'),
    body('worn').isBoolean().withMessage('worn must be boolean'),
    body('alcoholLevel').isInt({ min: 0, max: 1023 }).withMessage('alcoholLevel must be 0-1023'),
    body('batteryLevel').optional().isInt({ min: 0, max: 100 }),
  ],
  validate,
  sensorController.receiveSensorData
);

// ---------- Dashboard live queries (JWT) ----------
router.get('/live/:helmetCode', authenticate, sensorController.getLiveData);
router.get('/history/:helmetCode', authenticate, sensorController.getHistory);
router.get('/stats/:helmetCode', authenticate, sensorController.getStats);

export default router;