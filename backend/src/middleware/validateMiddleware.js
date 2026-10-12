// ==================================================
// Validation Middleware (express-validator wrapper)
// ==================================================

import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/helpers.js';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(
      res,
      'Validation failed',
      400,
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
}