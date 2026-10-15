// ==================================================
// Simulator Routes — ADMIN only
// ==================================================

import express from 'express';
import { body } from 'express-validator';
import * as simulatorController from '../controllers/simulatorController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

// All routes require JWT + ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

router.post(
  '/send',
  [
    body('helmetCode').trim().notEmpty().withMessage('helmetCode is required'),
    body('bikeCode').trim().notEmpty().withMessage('bikeCode is required'),
    body('worn').isBoolean().withMessage('worn must be true or false'),
    body('alcoholLevel').isInt({ min: 0, max: 1023 }).withMessage('alcoholLevel must be 0-1023'),
    body('batteryLevel').optional().isInt({ min: 0, max: 100 }),
  ],
  validate,
  simulatorController.simulateSensorData
);

export default router;