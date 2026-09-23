import { NextResponse } from 'next/server';
import admin from '../../../../firebase/adminConfig';
import { verifySignedPayload } from '../../../../utils/sessionSecurity';
import { checkRateLimit, getClientIp } from '../../../../utils/rateLimiter';
import { logger } from '../../../../utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/verify
 * Server-side endpoint to verify admin authorization.
 * Checks the HttpOnly __session cookie or Authorization Bearer token.
 */
export async function GET(req) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`admin-verify:${ip}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    let isAuthorized = false;
    let userEmail = null;

    // 1. Inspect Bearer token in Authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      if (admin.apps.length) {
        try {
          const decoded = await admin.auth().verifyIdToken(idToken);
          userEmail = decoded.email;
          if (
            decoded.admin === true ||
            (decoded.email_verified && decoded.email?.toLowerCase() === 'ekpeprinceesor@gmail.com')
          ) {
            isAuthorized = true;
          }
        } catch {
          // Token invalid, fall through to cookie check
        }
      }
    }

    // 2. Inspect secure __session cookie
    if (!isAuthorized) {
      const sessionCookie = req.cookies.get('__session')?.value;
      if (sessionCookie) {
        const payload = verifySignedPayload(sessionCookie);
        if (payload && payload.isAdmin) {
          isAuthorized = true;
          userEmail = payload.email;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { authorized: false, error: 'Forbidden: Insufficient administrative privileges' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authorized: true,
      email: userEmail
    });
  } catch (err) {
    logger.error('Admin verification error:', err.message);
    return NextResponse.json(
      { authorized: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
