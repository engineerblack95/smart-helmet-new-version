// ==================================================
// Auth Controller — HTTP handlers
// ==================================================

import * as authService from '../services/authService.js';
import { successResponse, errorResponse, asyncHandler } from '../utils/helpers.js';

export const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, phone, role } = req.body;
  const result = await authService.registerUser({ email, password, fullName, phone, role });
  return successResponse(res, result, 'Registration successful', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });
  return successResponse(res, result, 'Login successful');
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user.id);
  return successResponse(res, user, 'Profile retrieved');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  const user = await authService.updateUserProfile(req.user.id, { fullName, phone });
  return successResponse(res, user, 'Profile updated');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user.id, { currentPassword, newPassword });
  return successResponse(res, result, 'Password changed');
});