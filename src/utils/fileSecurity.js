/**
 * File Upload Security Utility for AfroEduGo.
 * Validates file uploads on the client and server side before they reach storage.
 */

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

export const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif'
]);

export const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png'
]);

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validates an uploaded file object.
 * @param {File|Blob} file File to inspect
 * @param {Object} options Configuration options
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = MAX_IMAGE_SIZE_BYTES,
    allowedTypes = ALLOWED_IMAGE_TYPES,
    allowedExtensions = ALLOWED_IMAGE_EXTENSIONS,
    label = 'File'
  } = options;

  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // 1. Check File Size
  if (file.size > maxSize) {
    const sizeInMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `${label} exceeds maximum allowed size of ${sizeInMB} MB.` };
  }

  // 2. Check MIME Type
  if (file.type && !allowedTypes.has(file.type.toLowerCase())) {
    return { valid: false, error: `${label} type "${file.type}" is not supported. Allowed formats: JPEG, PNG, WebP, GIF.` };
  }

  // 3. Check File Extension (if file has a name)
  if (file.name) {
    const nameLower = file.name.toLowerCase();
    const lastDotIndex = nameLower.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return { valid: false, error: `${label} must have a valid file extension.` };
    }
    const ext = nameLower.slice(lastDotIndex);
    if (!allowedExtensions.has(ext)) {
      return { valid: false, error: `Invalid file extension "${ext}".` };
    }

    // Guard against dangerous double extensions (e.g. .php.png, .exe.jpg)
    const dangerousExtensions = ['.exe', '.bat', '.sh', '.php', '.phtml', '.js', '.mjs', '.html', '.svg'];
    const parts = nameLower.split('.');
    if (parts.length > 2) {
      for (const dangerous of dangerousExtensions) {
        if (nameLower.includes(dangerous)) {
          return { valid: false, error: 'Suspicious file name detected. Double extensions not permitted.' };
        }
      }
    }
  }

  return { valid: true };
}
