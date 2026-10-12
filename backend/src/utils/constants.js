// ==================================================
// System Constants
// ==================================================

export const ALCOHOL_THRESHOLD = 300; // raw MQ-3 reading (0-1023)
export const RIDE_TIMEOUT_MS = 60 * 1000; // 60 seconds
export const SENSOR_INTERVAL_MS = 500; // firmware sends every 500ms

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  OWNER: 'OWNER',
  RIDER: 'RIDER',
};

export const VIOLATION_TYPES = {
  NO_HELMET: 'NO_HELMET',
  ALCOHOL_DETECTED: 'ALCOHOL_DETECTED',
  WRONG_HELMET: 'WRONG_HELMET',
  SENSOR_MALFUNCTION: 'SENSOR_MALFUNCTION',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
};

export const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const RIDE_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED',
};

export const DEVICE_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  MAINTENANCE: 'MAINTENANCE',
};

export const SOCKET_EVENTS = {
  SENSOR_UPDATE: 'sensor:update',
  VIOLATION_NEW: 'violation:new',
  RIDE_START: 'ride:start',
  RIDE_END: 'ride:end',
  DEVICE_STATUS: 'device:status',
  ALERT_NEW: 'alert:new',
  JOIN_HELMET: 'join:helmet',
  LEAVE_HELMET: 'leave:helmet',
};