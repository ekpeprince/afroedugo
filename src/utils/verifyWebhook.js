import crypto from 'crypto';

/**
 * Verifies webhook signatures using HMAC-SHA256 and constant-time comparison.
 * Protects against replay attacks, payload tampering, and timing side-channels.
 *
 * @param {string} payload Raw request body string
 * @param {string} signature Header signature (e.g. from Resend, Stripe, or standardwebhooks)
 * @param {string} secret Shared webhook signing secret
 * @param {number} toleranceSec Allowed timestamp skew (default: 300 seconds = 5 minutes)
 * @returns {{ valid: boolean, error?: string }}
 */
export function verifyWebhookSignature(payload, signature, secret, toleranceSec = 300) {
  if (!payload || !signature || !secret) {
    return { valid: false, error: 'Missing payload, signature, or secret' };
  }

  try {
    // 1. Check for timestamped signature header format: "t=123456789,v1=abcdef..."
    let timestamp = null;
    let expectedSig = signature;

    if (signature.includes('t=') && signature.includes('v1=')) {
      const parts = signature.split(',');
      for (const part of parts) {
        const [key, val] = part.split('=');
        if (key === 't') timestamp = parseInt(val, 10);
        if (key === 'v1') expectedSig = val;
      }

      // Check for replay attacks (timestamp within tolerance)
      if (timestamp) {
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > toleranceSec) {
          return { valid: false, error: 'Webhook timestamp outside tolerance window (replay attack detected)' };
        }
      }
    }

    // 2. Compute HMAC-SHA256 signature
    const dataToSign = timestamp ? `${timestamp}.${payload}` : payload;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(dataToSign, 'utf8');
    const computedSignature = hmac.digest('hex');

    // 3. Constant-time comparison
    const sigBuffer = Buffer.from(expectedSig, 'hex');
    const compBuffer = Buffer.from(computedSignature, 'hex');

    if (sigBuffer.length !== compBuffer.length) {
      return { valid: false, error: 'Signature length mismatch' };
    }

    const matches = crypto.timingSafeEqual(sigBuffer, compBuffer);
    if (!matches) {
      return { valid: false, error: 'Invalid webhook signature' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Signature verification error: ${err.message}` };
  }
}
