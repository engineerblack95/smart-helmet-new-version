// ==================================================
// Dashboard Routes
// ==================================================

import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/overview', dashboardController.getOverview);
router.get('/violations/trends', dashboardController.getViolationTrends);

export default router;