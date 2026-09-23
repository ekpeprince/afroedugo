/**
 * Database Security & Parameterized Query Utility for AfroEduGo.
 * Protects against SQL Injection, NoSQL Injection, Path Traversal,
 * and Type-Confusion in Database Operations.
 */

const ALLOWED_COLLECTIONS = new Set([
  'users',
  'schools',
  'housing',
  'services',
  'favorites',
  'discussions',
  'comments',
  'stories',
  'notifications',
  'conversations',
  'messages',
  'leads',
  'enrollments',
  'newsletter_subscribers'
]);

// Valid Firestore Document ID pattern (alphanumeric, dashes, underscores)
const VALID_DOC_ID_REGEX = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Validates that a collection name belongs to the application's authorized whitelist.
 */
export function validateCollection(collectionName) {
  if (typeof collectionName !== 'string' || !ALLOWED_COLLECTIONS.has(collectionName)) {
    throw new Error(`Unauthorized or invalid collection name: "${collectionName}"`);
  }
  return collectionName;
}

/**
 * Validates a document ID to prevent path traversal (e.g. `../../admin`).
 */
export function validateDocId(id) {
  if (typeof id !== 'string' || !VALID_DOC_ID_REGEX.test(id)) {
    throw new Error(`Invalid or malformed document ID: "${id}"`);
  }
  return id;
}

/**
 * Sanitizes input values before passing to NoSQL queries.
 * Prevents object injection attacks where an attacker passes an object
 * with query operator semantics instead of a scalar string or number.
 */
export function sanitizeNoSqlValue(value) {
  if (value === null || value === undefined) return null;
  const type = typeof value;
  if (type === 'string') return value.trim();
  if (type === 'number' || type === 'boolean') return value;
  if (value instanceof Date) return value;
  // If an attacker passed a plain object where a scalar was expected, reject it
  throw new Error('Type confusion detected: scalar value expected for database parameter');
}

/**
 * Parameterized SQL Query Builder for SQL-based drivers (e.g. Postgres, SQLite, BigQuery).
 * Ensures values are safely passed as parameters rather than string concatenation.
 *
 * @param {string} text SQL statement template with $1, $2 or ?
 * @param {Array} values Parameter values
 * @returns {{ text: string, values: Array }}
 */
export function createParameterizedQuery(text, values = []) {
  if (typeof text !== 'string') {
    throw new Error('SQL query text must be a string');
  }
  if (!Array.isArray(values)) {
    throw new Error('SQL query values must be an array');
  }

  // Ensure no unparameterized string concatenations of common SQL keywords
  const dangerousPatterns = [/--/, /;\s*DROP/i, /;\s*DELETE/i, /UNION\s+SELECT/i];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(text)) {
      throw new Error('Potential SQL Injection syntax detected in query template');
    }
  }

  return {
    text,
    values: values.map(val => (typeof val === 'string' ? val.trim() : val))
  };
}
