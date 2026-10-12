// ==================================================
// Helmet Routes
// ==================================================

import express from 'express';
import { body } from 'express-validator';
import * as helmetController from '../controllers/helmetController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', helmetController.listHelmets);
router.get('/stats', helmetController.getHelmetStats);
router.get('/:id', helmetController.getHelmet);

router.post(
  '/',
  authorize('ADMIN', 'OWNER'),
  [
    body('helmetCode').trim().notEmpty().withMessage('helmetCode is required'),
    body('ownerId').optional({ nullable: true }).isUUID(),
    body('batteryLevel').optional().isInt({ min: 0, max: 100 }),
  ],
  validate,
  helmetController.createHelmet
);

router.put('/:id', authorize('ADMIN', 'OWNER'), helmetController.updateHelmet);
router.delete('/:id', authorize('ADMIN'), helmetController.deleteHelmet);

export default router;