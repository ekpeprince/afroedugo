import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '../../../../utils/verifyWebhook';
import { checkRateLimit, getClientIp } from '../../../../utils/rateLimiter';
import { logger } from '../../../../utils/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/resend
 * Handles incoming webhooks from Resend / email providers.
 * Validates cryptographic signatures using HMAC-SHA256 and constant-time verification.
 */
export async function POST(req) {
  try {
    // 1. Rate Limiting: Max 100 webhook calls per minute
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`webhook-resend:${ip}`, 100, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('WEBHOOK_SECRET not configured on server');
      return NextResponse.json({ error: 'Webhook secret unconfigured' }, { status: 500 });
    }

    const rawPayload = await req.text();
    const signature = req.headers.get('svix-signature') || 
                      req.headers.get('resend-signature') || 
                      req.headers.get('x-webhook-signature');

    if (!signature) {
      logger.warn('Webhook request missing signature header from IP:', ip);
      return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 401 });
    }

    // 2. Cryptographic signature verification
    const verification = verifyWebhookSignature(rawPayload, signature, webhookSecret);
    if (!verification.valid) {
      logger.warn('Invalid webhook signature attempt:', verification.error);
      return NextResponse.json({ error: verification.error }, { status: 401 });
    }

    // 3. Process verified payload
    let event = null;
    try {
      event = JSON.parse(rawPayload);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    logger.info(`Received verified webhook event: ${event.type || 'unknown'}`);

    return NextResponse.json({ received: true, type: event.type });
  } catch (err) {
    logger.error('Error handling webhook:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
