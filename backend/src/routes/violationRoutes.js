// ==================================================
// Violation Routes
// ==================================================

import express from 'express';
import * as violationController from '../controllers/violationController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', violationController.listViolations);
router.get('/stats', violationController.getViolationStats);
router.get('/:id', violationController.getViolation);
router.put(
  '/:id/resolve',
  authorize('ADMIN', 'OWNER'),
  violationController.resolveViolation
);

export default router;