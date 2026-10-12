// ==================================================
// Bike Routes
// ==================================================

import express from 'express';
import { body } from 'express-validator';
import * as bikeController from '../controllers/bikeController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', bikeController.listBikes);
router.get('/stats', bikeController.getBikeStats);
router.get('/:id', bikeController.getBike);

router.post(
  '/',
  authorize('ADMIN', 'OWNER'),
  [
    body('bikeCode').trim().notEmpty().withMessage('bikeCode is required'),
    body('plateNumber').optional({ nullable: true }).isString(),
    body('ownerId').optional({ nullable: true }).isUUID(),
    body('helmetId').optional({ nullable: true }).isUUID(),
  ],
  validate,
  bikeController.createBike
);

router.put('/:id', authorize('ADMIN', 'OWNER'), bikeController.updateBike);
router.delete('/:id', authorize('ADMIN'), bikeController.deleteBike);

export default router;