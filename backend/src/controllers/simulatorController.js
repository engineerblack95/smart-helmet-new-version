// ==================================================
// Simulator Controller — Admin-only test endpoint
// ==================================================
// This endpoint lets authorized ADMIN users inject
// sensor readings through the dashboard instead of
// using curl/Postman. It reuses the EXACT same
// processing pipeline as real device data.
// ==================================================

import * as sensorService from '../services/sensorService.js';
import { successResponse, asyncHandler } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * POST /api/simulator/send
 * Simulates a sensor packet for testing.
 * Uses the same processSensorData service as real devices.
 */
export const simulateSensorData = asyncHandler(async (req, res) => {
  const { helmetCode, bikeCode, worn, alcoholLevel, batteryLevel } = req.body;

  logger.info(
    `🧪 Simulator: ${req.user.email} injected packet ` +
    `helmet=${helmetCode} bike=${bikeCode} worn=${worn} alcohol=${alcoholLevel}`
  );

  const io = req.app.get('io');
  const result = await sensorService.processSensorData(
    { helmetCode, bikeCode, worn, alcoholLevel, batteryLevel },
    io
  );

  return successResponse(res, result, 'Simulated sensor data processed');
});