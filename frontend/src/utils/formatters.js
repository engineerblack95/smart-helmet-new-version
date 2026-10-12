// ==================================================
// Formatters
// ==================================================

import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(date) {
  if (!date) return '—';
  try {
    return format(new Date(date), 'MMM d, yyyy HH:mm');
  } catch {
    return '—';
  }
}

export function formatTime(date) {
  if (!date) return '—';
  try {
    return format(new Date(date), 'HH:mm:ss');
  } catch {
    return '—';
  }
}

export function timeAgo(date) {
  if (!date) return 'never';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'never';
  }
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}