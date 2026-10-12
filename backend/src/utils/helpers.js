// ==================================================
// Helper Functions
// ==================================================

import { ALCOHOL_THRESHOLD } from './constants.js';

/**
 * Parse Bluetooth packet from helmet Arduino.
 * Format: "H001,1,150,85"  →  { helmetCode, worn, alcoholLevel, batteryLevel }
 */
export function parseHelmetPacket(packet) {
  if (typeof packet !== 'string') return null;
  const parts = packet.trim().split(',');
  if (parts.length < 4) return null;
  const [helmetCode, wornFlag, alcoholLevel, batteryLevel] = parts;
  return {
    helmetCode,
    worn: wornFlag === '1' || wornFlag === 'true',
    alcoholLevel: parseInt(alcoholLevel, 10) || 0,
    batteryLevel: parseInt(batteryLevel, 10) || 0,
  };
}

/**
 * Apply AND-gate logic.
 */
export function computeEngineAllowed({ idMatch, isWorn, isSober }) {
  return Boolean(idMatch && isWorn && isSober);
}

export function isSober(alcoholLevel) {
  return Number(alcoholLevel) < ALCOHOL_THRESHOLD;
}

export function nowIso() {
  return new Date().toISOString();
}

/**
 * Standard API success response.
 */
export function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Standard API error response.
 */
export function errorResponse(res, message = 'Error', statusCode = 400, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

/**
 * Async wrapper to avoid try/catch in every controller.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);