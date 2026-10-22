// ==================================================
// Device Key Controller — ADMIN only
// ==================================================

import * as deviceKeyService from '../services/deviceKeyService.js';
import { successResponse, asyncHandler } from '../utils/helpers.js';

export const listKeys = asyncHandler(async (req, res) => {
  const reveal = req.query.reveal === 'true';
  const keys = await deviceKeyService.getAllDeviceKeys({ reveal });
  return successResponse(res, keys, 'Device keys retrieved');
});

export const revealKey = asyncHandler(async (req, res) => {
  const key = await deviceKeyService.getDeviceKeyById(req.params.id);
  return successResponse(
    res,
    { apiKey: key.apiKey },
    'Key revealed — copy it now, you will not see it again'
  );
});

export const createKey = asyncHandler(async (req, res) => {
  const { deviceCode, deviceType } = req.body;
  const key = await deviceKeyService.createDeviceKey({ deviceCode, deviceType });
  return successResponse(
    res,
    key,
    'Device key created — copy the apiKey now, you will not see it again',
    201
  );
});

export const rotateKey = asyncHandler(async (req, res) => {
  const key = await deviceKeyService.rotateDeviceKey(req.params.id);
  return successResponse(
    res,
    key,
    'Key rotated — copy the new apiKey now, you will not see it again'
  );
});

export const revokeKey = asyncHandler(async (req, res) => {
  const key = await deviceKeyService.revokeDeviceKey(req.params.id);
  return successResponse(res, key, 'Key revoked — device is now blocked');
});