// ==================================================
// Violation Controller
// ==================================================

import * as violationService from '../services/violationService.js';
import { successResponse, asyncHandler } from '../utils/helpers.js';

export const listViolations = asyncHandler(async (req, res) => {
  const { resolved, severity, type, helmetCode, limit } = req.query;

  const filters = { severity, type, helmetCode, limit };
  if (resolved === 'true') filters.resolved = true;
  if (resolved === 'false') filters.resolved = false;

  const violations = await violationService.getAllViolations(filters);
  return successResponse(res, violations, 'Violations retrieved');
});

export const getViolationStats = asyncHandler(async (req, res) => {
  const stats = await violationService.getViolationStats();
  return successResponse(res, stats, 'Violation stats retrieved');
});

export const getViolation = asyncHandler(async (req, res) => {
  const violation = await violationService.getViolationById(req.params.id);
  return successResponse(res, violation, 'Violation retrieved');
});

export const resolveViolation = asyncHandler(async (req, res) => {
  const violation = await violationService.resolveViolation(req.params.id, req.user.id);
  const io = req.app.get('io');
  if (io) io.emit('violation:resolved', violation);
  return successResponse(res, violation, 'Violation resolved');
});