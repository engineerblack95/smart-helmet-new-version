// ==================================================
// Sensor Service — CORE AND-GATE LOGIC
// ==================================================
// This is the brain of the entire system.
// It receives data from the ESP32, applies the AND gate,
// saves logs, detects violations, and returns engineAllowed.
// ==================================================

import { prisma } from '../config/database.js';
import { ALCOHOL_THRESHOLD, RIDE_TIMEOUT_MS, SOCKET_EVENTS } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Process sensor data coming from the ESP32 bike unit.
 *
 * Expected body:
 *   { helmetCode, bikeCode, worn, alcoholLevel, batteryLevel }
 *
 * Returns the full decision payload back to the ESP32.
 */
export async function processSensorData(payload, io) {
  const { helmetCode, bikeCode, worn, alcoholLevel, batteryLevel } = payload;

  // ---------- 1. LOOKUP HELMET & BIKE ----------
  const helmet = await prisma.helmet.findUnique({
    where: { helmetCode },
  });
  if (!helmet) {
    const error = new Error(`Helmet ${helmetCode} not found`);
    error.statusCode = 404;
    throw error;
  }

  const bike = await prisma.bike.findUnique({
    where: { bikeCode },
  });
  if (!bike) {
    const error = new Error(`Bike ${bikeCode} not found`);
    error.statusCode = 404;
    throw error;
  }

  // ---------- 2. APPLY AND-GATE LOGIC ----------
  const idMatch = bike.helmetId === helmet.id;
  const isWorn = worn === true;
  const isSober = Number(alcoholLevel) < ALCOHOL_THRESHOLD;
  const alcoholDetected = !isSober;
  const engineAllowed = idMatch && isWorn && isSober; // ← THE AND GATE
  const relayState = engineAllowed; // fail-safe: OFF unless allowed

  // ---------- 3. FIND OR CREATE ACTIVE RIDE ----------
  let ride = await prisma.ride.findFirst({
    where: {
      helmetId: helmet.id,
      bikeId: bike.id,
      status: 'ACTIVE',
    },
  });

  const isNewRide = !ride;
  if (!ride) {
    ride = await prisma.ride.create({
      data: {
        riderId: helmet.ownerId,
        helmetId: helmet.id,
        bikeId: bike.id,
        status: 'ACTIVE',
      },
    });
    logger.info(`🛣️  New ride started: ${ride.id} (${helmet.helmetCode} + ${bike.bikeCode})`);
    if (io) io.emit(SOCKET_EVENTS.RIDE_START, { ride });
  }

  // ---------- 4. SAVE SENSOR LOG ----------
  const sensorLog = await prisma.sensorLog.create({
    data: {
      helmetId: helmet.id,
      rideId: ride.id,
      worn: isWorn,
      alcoholDetected,
      alcoholLevel: Number(alcoholLevel),
      batteryLevel: batteryLevel ?? null,
      engineAllowed,
      relayState,
    },
  });

  // ---------- 5. UPDATE DEVICE STATUS ----------
  await prisma.helmet.update({
    where: { id: helmet.id },
    data: {
      status: 'ONLINE',
      lastSeenAt: new Date(),
      ...(batteryLevel !== undefined && { batteryLevel }),
    },
  });

  await prisma.bike.update({
    where: { id: bike.id },
    data: {
      status: 'ONLINE',
      lastSeenAt: new Date(),
    },
  });

  // ---------- 6. DETECT VIOLATIONS ----------
  const violations = [];

  if (!idMatch) {
    violations.push({
      type: 'WRONG_HELMET',
      severity: 'HIGH',
      description: `Helmet ${helmet.helmetCode} is not paired to bike ${bike.bikeCode}`,
    });
  }

  if (!isWorn) {
    violations.push({
      type: 'NO_HELMET',
      severity: 'HIGH',
      description: `Helmet ${helmet.helmetCode} is not being worn`,
    });
  }

  if (!isSober) {
    violations.push({
      type: 'ALCOHOL_DETECTED',
      severity: 'CRITICAL',
      description: `Alcohol detected (level ${alcoholLevel}, threshold ${ALCOHOL_THRESHOLD})`,
      alcoholLevel: Number(alcoholLevel),
    });
  }

  // ---------- 7. SAVE VIOLATIONS + ALERTS ----------
  const savedViolations = [];

  for (const v of violations) {
    const violation = await prisma.violation.create({
      data: {
        helmetId: helmet.id,
        riderId: helmet.ownerId,
        rideId: ride.id,
        type: v.type,
        severity: v.severity,
        description: v.description,
        alcoholLevel: v.alcoholLevel ?? null,
      },
    });

    const alert = await prisma.alert.create({
      data: {
        violationId: violation.id,
        message: `[${v.severity}] ${v.type} — ${v.description}`,
        status: 'PENDING',
      },
    });

    savedViolations.push(violation);

    logger.warn(`⚠️  Violation: ${v.type} (${v.severity}) on ${helmet.helmetCode}`);

    if (io) {
      io.emit(SOCKET_EVENTS.VIOLATION_NEW, violation);
      io.emit(SOCKET_EVENTS.ALERT_NEW, alert);
    }
  }

  // ---------- 8. UPDATE RIDE VIOLATION COUNT ----------
  if (savedViolations.length > 0) {
    ride = await prisma.ride.update({
      where: { id: ride.id },
      data: { totalViolations: { increment: savedViolations.length } },
    });
  }

  // ---------- 9. EMIT LIVE SENSOR UPDATE ----------
  const timestamp = new Date();
  const updatePayload = {
    helmetCode: helmet.helmetCode,
    bikeCode: bike.bikeCode,
    worn: isWorn,
    alcoholLevel: Number(alcoholLevel),
    alcoholDetected,
    batteryLevel: batteryLevel ?? helmet.batteryLevel,
    engineAllowed,
    relayState,
    idMatch,
    isWorn,
    isSober,
    violations: violations.map((v) => v.type),
    rideId: ride.id,
    timestamp,
  };

  if (io) {
    io.emit(SOCKET_EVENTS.SENSOR_UPDATE, updatePayload);
  }

  // ---------- 10. RETURN TO ESP32 ----------
  return {
    engineAllowed,
    relayState,
    idMatch,
    isWorn,
    isSober,
    violations: violations.map((v) => v.type),
    rideId: ride.id,
    timestamp,
    isNewRide,
    sensorLogId: sensorLog.id,
  };
}

/**
 * Get latest live reading for a helmet.
 */
export async function getLiveSensorData(helmetCode) {
  const helmet = await prisma.helmet.findUnique({
    where: { helmetCode },
    select: { id: true, helmetCode: true, batteryLevel: true, status: true, lastSeenAt: true },
  });

  if (!helmet) {
    const error = new Error(`Helmet ${helmetCode} not found`);
    error.statusCode = 404;
    throw error;
  }

  const latestLog = await prisma.sensorLog.findFirst({
    where: { helmetId: helmet.id },
    orderBy: { timestamp: 'desc' },
    include: {
      ride: {
        select: { id: true, status: true, startTime: true, totalViolations: true },
      },
    },
  });

  return {
    helmet,
    latest: latestLog,
  };
}

/**
 * Get sensor history for a helmet.
 */
export async function getSensorHistory(helmetCode, { limit = 100 } = {}) {
  const helmet = await prisma.helmet.findUnique({
    where: { helmetCode },
    select: { id: true },
  });

  if (!helmet) {
    const error = new Error(`Helmet ${helmetCode} not found`);
    error.statusCode = 404;
    throw error;
  }

  const logs = await prisma.sensorLog.findMany({
    where: { helmetId: helmet.id },
    orderBy: { timestamp: 'desc' },
    take: Math.min(Number(limit) || 100, 500),
  });

  return logs;
}

/**
 * Get sensor statistics for a helmet.
 */
export async function getSensorStats(helmetCode) {
  const helmet = await prisma.helmet.findUnique({
    where: { helmetCode },
    select: { id: true },
  });

  if (!helmet) {
    const error = new Error(`Helmet ${helmetCode} not found`);
    error.statusCode = 404;
    throw error;
  }

  const [total, engineAllowed, alcoholDetected, notWorn] = await Promise.all([
    prisma.sensorLog.count({ where: { helmetId: helmet.id } }),
    prisma.sensorLog.count({ where: { helmetId: helmet.id, engineAllowed: true } }),
    prisma.sensorLog.count({ where: { helmetId: helmet.id, alcoholDetected: true } }),
    prisma.sensorLog.count({ where: { helmetId: helmet.id, worn: false } }),
  ]);

  return {
    totalReadings: total,
    engineAllowedCount: engineAllowed,
    engineBlockedCount: total - engineAllowed,
    alcoholDetectedCount: alcoholDetected,
    notWornCount: notWorn,
  };
}

/**
 * Auto-complete rides that haven't received data in RIDE_TIMEOUT_MS.
 * Called periodically by a background interval in server.js.
 */
export async function completeStaleRides(io) {
  const cutoff = new Date(Date.now() - RIDE_TIMEOUT_MS);

  const staleRides = await prisma.ride.findMany({
    where: {
      status: 'ACTIVE',
      startTime: { lt: cutoff },
      sensorLogs: {
        none: { timestamp: { gte: cutoff } },
      },
    },
  });

  for (const ride of staleRides) {
    const endTime = new Date();
    const durationSec = Math.floor((endTime - ride.startTime) / 1000);

    const completed = await prisma.ride.update({
      where: { id: ride.id },
      data: {
        status: 'COMPLETED',
        endTime,
        durationSec,
      },
    });

    logger.info(`🏁 Ride ${ride.id} auto-completed (duration ${durationSec}s)`);

    if (io) io.emit(SOCKET_EVENTS.RIDE_END, { ride: completed });

    // Optionally set devices to offline
    await prisma.helmet.updateMany({
      where: { id: ride.helmetId },
      data: { status: 'OFFLINE' },
    });
    await prisma.bike.updateMany({
      where: { id: ride.bikeId },
      data: { status: 'OFFLINE' },
    });
  }

  return staleRides.length;
}