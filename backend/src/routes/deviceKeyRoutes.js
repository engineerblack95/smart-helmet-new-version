// ==================================================
// Device Key Routes — ADMIN only
// ==================================================

import express from 'express';
import { body } from 'express-validator';
import * as deviceKeyController from '../controllers/deviceKeyController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN')); // ⚠️ Only ADMIN can manage keys

router.get('/', deviceKeyController.listKeys);
router.get('/:id/reveal', deviceKeyController.revealKey);

router.post(
  '/',
  [
    body('deviceCode').trim().notEmpty().withMessage('deviceCode is required'),
    body('deviceType').isIn(['HELMET', 'BIKE']).withMessage('Must be HELMET or BIKE'),
  ],
  validate,
  deviceKeyController.createKey
);

router.put('/:id/rotate', deviceKeyController.rotateKey);
router.delete('/:id/revoke', deviceKeyController.revokeKey);

export default router;