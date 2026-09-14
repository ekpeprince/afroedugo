import { useState, useEffect } from 'react';

/**
 * Real-time Presence Utilities
 * 
 * Standardized presence threshold:
 * 3.5 minutes (210,000 ms) window for "online" when user heartbeat runs every 90 seconds.
 * This guarantees offline detection within ~3.5 minutes if connection drops or tab is killed,
 * while preventing false offline triggers between heartbeats.
 */
export const ONLINE_THRESHOLD_MS = 3.5 * 60 * 1000;

/**
 * Checks if a user is currently considered online.
 * @param {string} status - 'online' or 'offline'
 * @param {any} lastOnline - Firestore Timestamp, Date, string ISO, or number
 * @param {number} [thresholdMs] - optional override for threshold
 * @returns {boolean}
 */
export const isUserOnline = (status, lastOnline, thresholdMs = ONLINE_THRESHOLD_MS) => {
  if (status !== 'online') return false;
  if (!lastOnline) return true; // optimistic local write

  let lastOnlineMs;
  if (typeof lastOnline?.toMillis === 'function') {
    lastOnlineMs = lastOnline.toMillis();
  } else if (typeof lastOnline?.toDate === 'function') {
    lastOnlineMs = lastOnline.toDate().getTime();
  } else if (lastOnline instanceof Date) {
    lastOnlineMs = lastOnline.getTime();
  } else {
    lastOnlineMs = new Date(lastOnline).getTime();
  }

  if (isNaN(lastOnlineMs)) return true;

  const now = Date.now();
  // Handle slight future skew from server timestamp drift
  if (lastOnlineMs > now) return true;

  return (now - lastOnlineMs) < thresholdMs;
};

/**
 * Formats a lastOnline timestamp into a user-friendly string (e.g., "just now", "5m ago", "2h ago", "yesterday", "Sep 12").
 * @param {any} lastOnline 
 * @returns {string}
 */
export const formatLastOnline = (lastOnline) => {
  if (!lastOnline) return '';
  
  let date;
  if (typeof lastOnline?.toDate === 'function') {
    date = lastOnline.toDate();
  } else if (lastOnline instanceof Date) {
    date = lastOnline;
  } else {
    date = new Date(lastOnline);
  }

  if (!date || isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // If clock skew or very recent (< 60s)
  if (diffMs < 60000) return 'just now';

  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffMs / (24 * 3600000));
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * Hook to keep presence status and last seen label reactive in real time.
 * @param {string} status 
 * @param {any} lastOnline 
 * @param {number} [tickIntervalMs=20000] - interval to re-evaluate (default 20s)
 */
export const usePresenceStatus = (status, lastOnline, tickIntervalMs = 20000) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, tickIntervalMs);
    return () => clearInterval(interval);
  }, [tickIntervalMs]);

  const online = isUserOnline(status, lastOnline);
  const lastSeen = online ? 'online' : (lastOnline ? `last seen ${formatLastOnline(lastOnline)}` : 'offline');

  return { isOnline: online, lastSeenText: lastSeen, formatLastOnline: () => formatLastOnline(lastOnline) };
};
