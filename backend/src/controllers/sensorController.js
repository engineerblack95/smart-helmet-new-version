// ==================================================
// Sensor Controller — IoT data ingestion + live queries
// ==================================================

import * as sensorService from '../services/sensorService.js';
import { successResponse, asyncHandler } from '../utils/helpers.js';

/**
 * POST /api/sensor/data
 * Called by ESP32 with x-api-key header.
 */
export const receiveSensorData = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await sensorService.processSensorData(req.body, io);
  return successResponse(res, result, 'Sensor data processed');
});

export const getLiveData = asyncHandler(async (req, res) => {
  const data = await sensorService.getLiveSensorData(req.params.helmetCode);
  return successResponse(res, data, 'Live data retrieved');
});

export const getHistory = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const logs = await sensorService.getSensorHistory(req.params.helmetCode, { limit });
  return successResponse(res, logs, 'History retrieved');
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await sensorService.getSensorStats(req.params.helmetCode);
  return successResponse(res, stats, 'Sensor stats retrieved');
});