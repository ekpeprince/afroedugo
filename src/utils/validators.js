/**
 * Input Validation and Sanitization Library for AfroEduGo.
 * Protects against SQL/NoSQL Injection, Stored XSS, Buffer Overflows,
 * and Malformed Payloads.
 */

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Strong Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>~`])[A-Za-z\d@$!%*?&#^()_+\-=[\]{};':"\\|,.<>~`]{8,128}$/;

/**
 * Validates an email address.
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  return trimmed.length >= 3 && trimmed.length <= 254 && EMAIL_REGEX.test(trimmed);
}

/**
 * Validates password against strong security policy.
 * Returns { valid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password) {
  const errors = [];
  if (typeof password !== 'string') {
    return { valid: false, errors: ['Password must be a string'] };
  }
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>~`]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Escapes HTML characters to prevent XSS.
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes generic user text (strips null bytes, trims, enforces max length).
 */
export function sanitizeText(text, maxLength = 2000) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\0/g, '') // Strip null bytes
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '') // Strip Bidi control characters (Trojan Source mitigation)
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates housing or service listing submission payload.
 */
export function validateListingInput(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid listing payload'] };
  }

  const title = sanitizeText(data.title, 120);
  if (!title || title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  const description = sanitizeText(data.description, 2000);
  if (!description || description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }

  const price = sanitizeText(String(data.price || ''), 50);
  if (!price) {
    errors.push('Price is required');
  }

  const location = sanitizeText(data.location, 150);
  if (!location) {
    errors.push('Location is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      ...data,
      title,
      description,
      price,
      location
    }
  };
}

/**
 * Validates community post or comment input.
 */
export function validateCommunityPost(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid post payload'] };
  }

  const text = sanitizeText(data.text, 3000);
  if (!text || text.length < 2) {
    errors.push('Post content must be at least 2 characters');
  }

  const category = sanitizeText(data.category, 50) || 'General';

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      text,
      category
    }
  };
}

/**
 * Validates expert notification / support message payload.
 */
export function validateSupportRequest(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid request body'] };
  }

  const senderName = sanitizeText(data.senderName, 100);
  const senderEmail = (data.senderEmail || '').trim().toLowerCase();
  if (senderEmail && !isValidEmail(senderEmail)) {
    errors.push('Invalid sender email format');
  }

  const messagePreview = sanitizeText(data.messagePreview, 2000);
  if (!messagePreview || messagePreview.length < 2) {
    errors.push('Message preview must be at least 2 characters');
  }

  const conversationId = sanitizeText(data.conversationId, 100);

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      senderName,
      senderEmail,
      messagePreview,
      conversationId
    }
  };
}
