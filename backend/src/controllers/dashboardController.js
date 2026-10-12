// ==================================================
// Dashboard Controller — Aggregated stats
// ==================================================

import { prisma } from '../config/database.js';
import * as violationService from '../services/violationService.js';
import { successResponse, asyncHandler } from '../utils/helpers.js';

export const getOverview = asyncHandler(async (req, res) => {
  const [
    totalHelmets,
    totalBikes,
    activeRides,
    violations24h,
    onlineHelmets,
    onlineBikes,
  ] = await Promise.all([
    prisma.helmet.count(),
    prisma.bike.count(),
    prisma.ride.count({ where: { status: 'ACTIVE' } }),
    prisma.violation.count({
      where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.helmet.count({ where: { status: 'ONLINE' } }),
    prisma.bike.count({ where: { status: 'ONLINE' } }),
  ]);

  const recentViolations = await prisma.violation.findMany({
    orderBy: { timestamp: 'desc' },
    take: 5,
    include: {
      helmet: { select: { helmetCode: true } },
    },
  });

  return successResponse(
    res,
    {
      totals: {
        helmets: totalHelmets,
        bikes: totalBikes,
        activeRides,
        violations24h,
      },
      online: {
        helmets: onlineHelmets,
        bikes: onlineBikes,
      },
      recentViolations,
    },
    'Overview retrieved'
  );
});

export const getViolationTrends = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;
  const trends = await violationService.getViolationTrends(days);
  return successResponse(res, trends, 'Trends retrieved');
});