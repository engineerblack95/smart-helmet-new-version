// ==================================================
// Device Key Service — Generate, rotate, revoke
// ==================================================

import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Generate a new 256-bit API key (64-char hex).
 */
export function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * List all device keys (masked by default).
 */
export async function getAllDeviceKeys({ reveal = false } = {}) {
  const keys = await prisma.deviceKey.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return keys.map((k) => ({
    id: k.id,
    deviceCode: k.deviceCode,
    deviceType: k.deviceType,
    isActive: k.isActive,
    lastUsedAt: k.lastUsedAt,
    createdAt: k.createdAt,
    apiKey: reveal ? k.apiKey : maskKey(k.apiKey),
  }));
}

/**
 * Get a single key with full value (for reveal action).
 */
export async function getDeviceKeyById(id) {
  const key = await prisma.deviceKey.findUnique({ where: { id } });
  if (!key) {
    const error = new Error('Device key not found');
    error.statusCode = 404;
    throw error;
  }
  return key;
}

/**
 * Generate a new device key for a specific device.
 */
export async function createDeviceKey({ deviceCode, deviceType }) {
  // Check if code already exists
  const existing = await prisma.deviceKey.findUnique({
    where: { deviceCode },
  });
  if (existing) {
    const error = new Error(
      `Device key for ${deviceCode} already exists. Use rotate instead.`
    );
    error.statusCode = 409;
    throw error;
  }

  const apiKey = generateApiKey();
  const key = await prisma.deviceKey.create({
    data: {
      deviceCode,
      apiKey,
      deviceType,
      isActive: true,
    },
  });

  logger.info(
    `🔑 New device key created: ${deviceCode} (${deviceType}) — full key shown once`
  );

  // Return the full key — this is the ONLY time it will be visible
  return key;
}

/**
 * Rotate an existing device key. Old key is immediately invalidated.
 */
export async function rotateDeviceKey(id) {
  const existing = await getDeviceKeyById(id);

  const newApiKey = generateApiKey();
  const updated = await prisma.deviceKey.update({
    where: { id },
    data: {
      apiKey: newApiKey,
      isActive: true,
    },
  });

  logger.warn(`🔄 Device key rotated: ${existing.deviceCode} — old key invalidated`);

  return updated;
}

/**
 * Revoke a device key (soft delete — sets isActive to false).
 */
export async function revokeDeviceKey(id) {
  const existing = await getDeviceKeyById(id);

  const revoked = await prisma.deviceKey.update({
    where: { id },
    data: { isActive: false },
  });

  logger.warn(`🚫 Device key revoked: ${existing.deviceCode}`);

  return revoked;
}

/**
 * Mask an API key for display (show first 4 and last 4 characters).
 */
function maskKey(key) {
  return `••••••••••••••••••••••••••••••••${key.slice(-4)}`;
}