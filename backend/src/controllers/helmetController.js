// ==================================================
// Helmet Controller
// ==================================================

import * as helmetService from '../services/helmetService.js';
import { successResponse, asyncHandler } from '../utils/helpers.js';

export const listHelmets = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const helmets = await helmetService.getAllHelmets({ status, search });
  return successResponse(res, helmets, 'Helmets retrieved');
});

export const getHelmetStats = asyncHandler(async (req, res) => {
  const stats = await helmetService.getHelmetStats();
  return successResponse(res, stats, 'Helmet stats retrieved');
});

export const getHelmet = asyncHandler(async (req, res) => {
  const helmet = await helmetService.getHelmetById(req.params.id);
  return successResponse(res, helmet, 'Helmet retrieved');
});

export const createHelmet = asyncHandler(async (req, res) => {
  const helmet = await helmetService.createHelmet(req.body);
  return successResponse(res, helmet, 'Helmet created', 201);
});

export const updateHelmet = asyncHandler(async (req, res) => {
  const helmet = await helmetService.updateHelmet(req.params.id, req.body);
  return successResponse(res, helmet, 'Helmet updated');
});

export const deleteHelmet = asyncHandler(async (req, res) => {
  const result = await helmetService.deleteHelmet(req.params.id);
  return successResponse(res, result, 'Helmet deleted');
});