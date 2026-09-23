import { NextResponse } from 'next/server';
import admin from '../../../../firebase/adminConfig';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '../../../../utils/rateLimiter';
import { logger } from '../../../../utils/logger';

import { signPayload } from '../../../../utils/sessionSecurity';

/**
 * POST /api/auth/session
 * Generates an HttpOnly, SameSite=Lax, Secure session cookie.
 * Auth tokens are NEVER stored in localStorage or exposed to client-side scripts.
 */
export async function POST(req) {
  try {
    // 1. Rate limit session exchanges (max 15 attempts/min per IP)
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`auth-session:${ip}`, 15, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many authentication attempts. Please slow down.' }, { 
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }

    const body = await req.json();
    const idToken = body?.idToken;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Valid ID token required' }, { status: 400 });
    }

    let uid = null;
    let email = null;
    let isAdmin = false;

    // Verify token with Firebase Admin SDK if initialized
    if (admin.apps.length) {
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        uid = decoded.uid;
        email = decoded.email || '';
        isAdmin = decoded.admin === true || 
          (decoded.email_verified && decoded.email?.toLowerCase() === 'ekpeprinceesor@gmail.com');
      } catch (tokenErr) {
        logger.warn('Failed to verify ID token:', tokenErr.message);
        return NextResponse.json({ error: 'Invalid or expired ID token' }, { status: 401 });
      }
    } else {
      // Decode unverified header/payload defensively to extract uid/email if admin SDK not configured
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          uid = payload.user_id || payload.sub;
          email = payload.email || '';
          isAdmin = (payload.email_verified && payload.email?.toLowerCase() === 'ekpeprinceesor@gmail.com');
        }
      } catch {
        return NextResponse.json({ error: 'Malformed token' }, { status: 400 });
      }
    }

    if (!uid) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    const sessionPayload = {
      uid,
      email,
      isAdmin,
      exp: Date.now() + 14 * 24 * 60 * 60 * 1000 // 14 days
    };

    const sessionToken = signPayload(sessionPayload);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `__session=${sessionToken}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=1209600', // 14 days
      ...(isProd ? ['Secure'] : [])
    ].join('; ');

    const response = NextResponse.json({ 
      success: true, 
      user: { uid, email, isAdmin } 
    });
    response.headers.append('Set-Cookie', cookieOptions);

    return response;
  } catch (err) {
    logger.error('Session creation error:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/session
 * Destroys the HttpOnly session cookie on logout.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    '__session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 UTC',
    ...(isProd ? ['Secure'] : [])
  ].join('; ');

  response.headers.append('Set-Cookie', cookieOptions);
  return response;
}
