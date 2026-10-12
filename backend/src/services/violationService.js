// ==================================================
// Violation Service — List, Filter, Resolve, Stats
// ==================================================

import { prisma } from '../config/database.js';

/**
 * List violations with filters.
 */
export async function getAllViolations({
  resolved,
  severity,
  type,
  helmetCode,
  limit = 100,
} = {}) {
  const where = {};

  if (resolved !== undefined) where.isResolved = resolved;
  if (severity) where.severity = severity;
  if (type) where.type = type;
  if (helmetCode) {
    where.helmet = { helmetCode };
  }

  return prisma.violation.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: Math.min(Number(limit) || 100, 500),
    include: {
      helmet: { select: { id: true, helmetCode: true } },
      rider: { select: { id: true, fullName: true, email: true } },
      ride: { select: { id: true, status: true, startTime: true } },
      alerts: { select: { id: true, status: true, message: true } },
    },
  });
}

/**
 * Get violation by ID.
 */
export async function getViolationById(id) {
  const violation = await prisma.violation.findUnique({
    where: { id },
    include: {
      helmet: { select: { id: true, helmetCode: true, ownerId: true } },
      rider: { select: { id: true, fullName: true, email: true, phone: true } },
      ride: { select: { id: true, status: true, startTime: true, durationSec: true } },
      alerts: true,
    },
  });

  if (!violation) {
    const error = new Error('Violation not found');
    error.statusCode = 404;
    throw error;
  }

  return violation;
}

/**
 * Resolve a violation.
 */
export async function resolveViolation(id, resolvedBy) {
  await getViolationById(id); // throws if not found

  const violation = await prisma.violation.update({
    where: { id },
    data: {
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy,
    },
    include: {
      helmet: { select: { id: true, helmetCode: true } },
    },
  });

  // Update related alerts to RESOLVED
  await prisma.alert.updateMany({
    where: { violationId: id },
    data: { status: 'RESOLVED' },
  });

  return violation;
}

/**
 * Get violation statistics.
 */
export async function getViolationStats() {
  const [
    total,
    unresolved,
    resolved,
    critical,
    high,
    medium,
    low,
    byType,
    last24h,
  ] = await Promise.all([
    prisma.violation.count(),
    prisma.violation.count({ where: { isResolved: false } }),
    prisma.violation.count({ where: { isResolved: true } }),
    prisma.violation.count({ where: { severity: 'CRITICAL' } }),
    prisma.violation.count({ where: { severity: 'HIGH' } }),
    prisma.violation.count({ where: { severity: 'MEDIUM' } }),
    prisma.violation.count({ where: { severity: 'LOW' } }),
    prisma.violation.groupBy({
      by: ['type'],
      _count: { _all: true },
    }),
    prisma.violation.count({
      where: {
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const byTypeMap = {};
  byType.forEach((row) => {
    byTypeMap[row.type] = row._count._all;
  });

  return {
    total,
    unresolved,
    resolved,
    critical,
    high,
    medium,
    low,
    last24h,
    byType: byTypeMap,
  };
}

/**
 * Get violation trends for last N days (default 7).
 */
export async function getViolationTrends(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const violations = await prisma.violation.findMany({
    where: { timestamp: { gte: startDate } },
    select: { timestamp: true, type: true, severity: true },
    orderBy: { timestamp: 'asc' },
  });

  // Build day buckets
  const buckets = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { date: key, total: 0, byType: {} };
  }

  violations.forEach((v) => {
    const key = v.timestamp.toISOString().slice(0, 10);
    if (buckets[key]) {
      buckets[key].total += 1;
      buckets[key].byType[v.type] = (buckets[key].byType[v.type] || 0) + 1;
    }
  });

  return Object.values(buckets);
}