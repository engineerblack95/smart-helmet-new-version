// ==================================================
// Authentication Middleware
// ==================================================
// - authenticate: verifies JWT (for dashboard users)
// - authenticateDevice: verifies x-api-key (for IoT devices)
// - authorize: role-based access control
// ==================================================

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/database.js';
import { errorResponse } from '../utils/helpers.js';

// ---------- JWT AUTH (dashboard users) ----------
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'User not found or inactive', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    }
    next(error);
  }
}

// ---------- API KEY AUTH (IoT devices) ----------
export async function authenticateDevice(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return errorResponse(res, 'Missing x-api-key header', 401);
    }

    const deviceKey = await prisma.deviceKey.findUnique({
      where: { apiKey },
    });

    if (!deviceKey || !deviceKey.isActive) {
      return errorResponse(res, 'Invalid or inactive API key', 401);
    }

    // Update lastUsedAt (fire-and-forget)
    prisma.deviceKey
      .update({
        where: { id: deviceKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    req.device = deviceKey;
    next();
  } catch (error) {
    next(error);
  }
}

// ---------- ROLE-BASED AUTH ----------
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Not authenticated', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }
    next();
  };
}