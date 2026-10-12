// ==================================================
// Bike Service — CRUD + Stats
// ==================================================

import { prisma } from '../config/database.js';

/**
 * List all bikes.
 */
export async function getAllBikes({ status, search } = {}) {
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { bikeCode: { contains: search, mode: 'insensitive' } },
      { plateNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.bike.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, fullName: true, email: true } },
      helmet: { select: { id: true, helmetCode: true, status: true } },
    },
  });
}

/**
 * Get bike by ID.
 */
export async function getBikeById(id) {
  const bike = await prisma.bike.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, fullName: true, email: true, phone: true } },
      helmet: {
        select: {
          id: true,
          helmetCode: true,
          status: true,
          batteryLevel: true,
          lastSeenAt: true,
        },
      },
      _count: {
        select: { rides: true },
      },
    },
  });

  if (!bike) {
    const error = new Error('Bike not found');
    error.statusCode = 404;
    throw error;
  }

  return bike;
}

/**
 * Get bike by bikeCode (e.g., "B001").
 */
export async function getBikeByCode(bikeCode) {
  const bike = await prisma.bike.findUnique({
    where: { bikeCode },
    include: {
      owner: { select: { id: true, fullName: true, email: true } },
      helmet: true,
    },
  });

  if (!bike) {
    const error = new Error(`Bike ${bikeCode} not found`);
    error.statusCode = 404;
    throw error;
  }

  return bike;
}

/**
 * Create a new bike.
 */
export async function createBike({ bikeCode, plateNumber, ownerId, helmetId, firmwareVer }) {
  const existing = await prisma.bike.findUnique({ where: { bikeCode } });
  if (existing) {
    const error = new Error(`Bike ${bikeCode} already exists`);
    error.statusCode = 409;
    throw error;
  }

  // If helmetId given, make sure it's not already paired to another bike
  if (helmetId) {
    const paired = await prisma.bike.findUnique({ where: { helmetId } });
    if (paired) {
      const error = new Error(`Helmet is already paired to bike ${paired.bikeCode}`);
      error.statusCode = 409;
      throw error;
    }
  }

  return prisma.bike.create({
    data: {
      bikeCode,
      plateNumber: plateNumber || null,
      ownerId: ownerId || null,
      helmetId: helmetId || null,
      firmwareVer: firmwareVer || '1.0.0',
      status: 'OFFLINE',
    },
    include: {
      owner: { select: { id: true, fullName: true, email: true } },
      helmet: { select: { id: true, helmetCode: true } },
    },
  });
}

/**
 * Update a bike.
 */
export async function updateBike(id, data) {
  await getBikeById(id); // throws if not found

  if (data.helmetId) {
    const paired = await prisma.bike.findUnique({ where: { helmetId: data.helmetId } });
    if (paired && paired.id !== id) {
      const error = new Error(`Helmet is already paired to bike ${paired.bikeCode}`);
      error.statusCode = 409;
      throw error;
    }
  }

  return prisma.bike.update({
    where: { id },
    data: {
      ...(data.plateNumber !== undefined && { plateNumber: data.plateNumber }),
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      ...(data.helmetId !== undefined && { helmetId: data.helmetId }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.firmwareVer !== undefined && { firmwareVer: data.firmwareVer }),
    },
    include: {
      owner: { select: { id: true, fullName: true, email: true } },
      helmet: { select: { id: true, helmetCode: true } },
    },
  });
}

/**
 * Delete a bike.
 */
export async function deleteBike(id) {
  await getBikeById(id); // throws if not found
  await prisma.bike.delete({ where: { id } });
  return { message: 'Bike deleted successfully' };
}

/**
 * Get bike statistics.
 */
export async function getBikeStats() {
  const [total, online, offline, maintenance] = await Promise.all([
    prisma.bike.count(),
    prisma.bike.count({ where: { status: 'ONLINE' } }),
    prisma.bike.count({ where: { status: 'OFFLINE' } }),
    prisma.bike.count({ where: { status: 'MAINTENANCE' } }),
  ]);

  return { total, online, offline, maintenance };
}