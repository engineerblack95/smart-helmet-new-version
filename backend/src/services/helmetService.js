// ==================================================
// Helmet Service — CRUD + Stats
// ==================================================

import { prisma } from '../config/database.js';

/**
 * List all helmets with owner + bike info.
 */
export async function getAllHelmets({ status, search } = {}) {
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.helmetCode = { contains: search, mode: 'insensitive' };
  }

  const helmets = await prisma.helmet.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: {
        select: { id: true, fullName: true, email: true },
      },
      bike: {
        select: { id: true, bikeCode: true, plateNumber: true },
      },
    },
  });

  return helmets;
}

/**
 * Get helmet by ID.
 */
export async function getHelmetById(id) {
  const helmet = await prisma.helmet.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      bike: {
        select: { id: true, bikeCode: true, plateNumber: true, status: true },
      },
      _count: {
        select: {
          rides: true,
          sensorLogs: true,
          violations: true,
        },
      },
    },
  });

  if (!helmet) {
    const error = new Error('Helmet not found');
    error.statusCode = 404;
    throw error;
  }

  return helmet;
}

/**
 * Get helmet by helmetCode (e.g., "H001").
 */
export async function getHelmetByCode(helmetCode) {
  const helmet = await prisma.helmet.findUnique({
    where: { helmetCode },
    include: {
      owner: {
        select: { id: true, fullName: true, email: true },
      },
      bike: true,
    },
  });

  if (!helmet) {
    const error = new Error(`Helmet ${helmetCode} not found`);
    error.statusCode = 404;
    throw error;
  }

  return helmet;
}

/**
 * Create a new helmet.
 */
export async function createHelmet({ helmetCode, ownerId, batteryLevel, firmwareVer }) {
  const existing = await prisma.helmet.findUnique({ where: { helmetCode } });
  if (existing) {
    const error = new Error(`Helmet ${helmetCode} already exists`);
    error.statusCode = 409;
    throw error;
  }

  return prisma.helmet.create({
    data: {
      helmetCode,
      ownerId: ownerId || null,
      batteryLevel: batteryLevel ?? 100,
      firmwareVer: firmwareVer || '1.0.0',
      status: 'OFFLINE',
    },
    include: {
      owner: { select: { id: true, fullName: true, email: true } },
    },
  });
}

/**
 * Update a helmet.
 */
export async function updateHelmet(id, data) {
  await getHelmetById(id); // throws if not found

  return prisma.helmet.update({
    where: { id },
    data: {
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      ...(data.batteryLevel !== undefined && { batteryLevel: data.batteryLevel }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.firmwareVer !== undefined && { firmwareVer: data.firmwareVer }),
    },
    include: {
      owner: { select: { id: true, fullName: true, email: true } },
      bike: { select: { id: true, bikeCode: true, plateNumber: true } },
    },
  });
}

/**
 * Delete a helmet.
 */
export async function deleteHelmet(id) {
  await getHelmetById(id); // throws if not found
  await prisma.helmet.delete({ where: { id } });
  return { message: 'Helmet deleted successfully' };
}

/**
 * Get helmet statistics.
 */
export async function getHelmetStats() {
  const [total, online, offline, maintenance] = await Promise.all([
    prisma.helmet.count(),
    prisma.helmet.count({ where: { status: 'ONLINE' } }),
    prisma.helmet.count({ where: { status: 'OFFLINE' } }),
    prisma.helmet.count({ where: { status: 'MAINTENANCE' } }),
  ]);

  return { total, online, offline, maintenance };
}