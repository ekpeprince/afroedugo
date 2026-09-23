import crypto from 'crypto';

const FALLBACK_SIGN_SECRET = process.env.CRON_SECRET || 'afroedugo_secure_fallback_salt_39105';

export function signPayload(payload) {
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', FALLBACK_SIGN_SECRET);
  hmac.update(data);
  const signature = hmac.digest('hex');
  return Buffer.from(JSON.stringify({ data, signature })).toString('base64url');
}

export function verifySignedPayload(tokenString) {
  if (!tokenString || typeof tokenString !== 'string') return null;
  try {
    const raw = Buffer.from(tokenString, 'base64url').toString('utf8');
    const { data, signature } = JSON.parse(raw);
    const hmac = crypto.createHmac('sha256', FALLBACK_SIGN_SECRET);
    hmac.update(data);
    const expected = hmac.digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
      const parsed = JSON.parse(data);
      if (parsed.exp && Date.now() > parsed.exp) return null;
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
