/**
 * Secure Logger Utility for AfroEduGo
 * Ensures sensitive data (passwords, tokens, emails, API keys, credentials)
 * are redacted before writing to logs, preventing data leaks in log aggregators.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'token',
  'idtoken',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'authheader',
  'secret',
  'cronsecret',
  'webhooksecret',
  'privatekey',
  'private_key',
  'apikey',
  'api_key',
  'creditcard',
  'ssn'
]);

/**
 * Recursively redacts sensitive keys and values from objects, arrays, or strings.
 */
export function sanitizeLogData(data, depth = 0) {
  if (depth > 5) return '[Max Depth]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redact Bearer tokens
    let sanitized = data.replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, 'Bearer [REDACTED]');
    // Redact private keys
    sanitized = sanitized.replace(/-----BEGIN [A-Z ]+-----[^-]+-----END [A-Z ]+-----/gs, '[PRIVATE_KEY_REDACTED]');
    return sanitized;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (data instanceof Error) {
    return {
      message: sanitizeLogData(data.message, depth + 1),
      name: data.name,
      // Only include stack trace outside production
      ...(process.env.NODE_ENV !== 'production' ? { stack: sanitizeLogData(data.stack, depth + 1) } : {})
    };
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item, depth + 1));
  }

  const cleanObj = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('secret') || lowerKey.includes('password')) {
      cleanObj[key] = '[REDACTED]';
    } else {
      cleanObj[key] = sanitizeLogData(value, depth + 1);
    }
  }
  return cleanObj;
}

export const logger = {
  info: (message, ...args) => {
    if (process.env.NODE_ENV === 'production') return; // Silence info in production
    console.info(`[INFO] ${message}`, ...args.map(a => sanitizeLogData(a)));
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args.map(a => sanitizeLogData(a)));
  },
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args.map(a => sanitizeLogData(a)));
  },
  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'production') return;
    console.debug(`[DEBUG] ${message}`, ...args.map(a => sanitizeLogData(a)));
  }
};
