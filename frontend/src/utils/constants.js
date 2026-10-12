// ==================================================
// Frontend Constants
// ==================================================

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const ALCOHOL_THRESHOLD = 300;

export const ROLES = {
  ADMIN: 'ADMIN',
  OWNER: 'OWNER',
  RIDER: 'RIDER',
};

// ==================================================
// Device status — ONLINE=green, MAINTENANCE=amber, OFFLINE=gray
// ==================================================
export const STATUS_COLORS = {
  ONLINE: 'bg-brand-green-light text-brand-green-dark',
  OFFLINE: 'bg-gray-100 text-gray-600',
  MAINTENANCE: 'bg-brand-amber-light text-brand-amber-dark',
};

// ==================================================
// Severity — CRITICAL/HIGH=red, MEDIUM=amber, LOW=gray
// ==================================================
export const SEVERITY_COLORS = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  MEDIUM: 'bg-brand-amber-light text-brand-amber-dark border-brand-amber/30',
  LOW: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const VIOLATION_LABELS = {
  NO_HELMET: 'No Helmet',
  ALCOHOL_DETECTED: 'Alcohol Detected',
  WRONG_HELMET: 'Wrong Helmet',
  SENSOR_MALFUNCTION: 'Sensor Malfunction',
  DEVICE_OFFLINE: 'Device Offline',
};