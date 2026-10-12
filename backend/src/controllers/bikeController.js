// ==================================================
// Bike Controller
// ==================================================

import * as bikeService from '../services/bikeService.js';
import { successResponse, asyncHandler } from '../utils/helpers.js';

export const listBikes = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const bikes = await bikeService.getAllBikes({ status, search });
  return successResponse(res, bikes, 'Bikes retrieved');
});

export const getBikeStats = asyncHandler(async (req, res) => {
  const stats = await bikeService.getBikeStats();
  return successResponse(res, stats, 'Bike stats retrieved');
});

export const getBike = asyncHandler(async (req, res) => {
  const bike = await bikeService.getBikeById(req.params.id);
  return successResponse(res, bike, 'Bike retrieved');
});

export const createBike = asyncHandler(async (req, res) => {
  const bike = await bikeService.createBike(req.body);
  return successResponse(res, bike, 'Bike created', 201);
});

export const updateBike = asyncHandler(async (req, res) => {
  const bike = await bikeService.updateBike(req.params.id, req.body);
  return successResponse(res, bike, 'Bike updated');
});

export const deleteBike = asyncHandler(async (req, res) => {
  const result = await bikeService.deleteBike(req.params.id);
  return successResponse(res, result, 'Bike deleted');
});