import { NextResponse } from 'next/server';
import admin from '../../../firebase/adminConfig';
import { checkRateLimit, getClientIp } from '../../../utils/rateLimiter';
import { sanitizeText } from '../../../utils/validators';
import { logger } from '../../../utils/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notify
 * Authenticated FCM push notification dispatcher.
 * Only verified admins are authorized to broadcast push notifications.
 */
export async function POST(request) {
  try {
    // 1. Rate limiting (max 20 push requests per minute per IP)
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`push-notify:${ip}`, 20, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many push requests. Please wait a minute.' }, { 
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }

    // 2. Authenticate caller with Firebase ID Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing bearer token' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];

    let callerUser = null;
    let isCallerAdmin = false;

    if (admin.apps.length) {
      try {
        callerUser = await admin.auth().verifyIdToken(idToken);
        isCallerAdmin = callerUser.admin === true || 
          (callerUser.email_verified && callerUser.email?.toLowerCase() === 'ekpeprinceesor@gmail.com');
      } catch (authErr) {
        logger.warn('Push notification unauthorized token:', authErr.message);
        return NextResponse.json({ error: 'Unauthorized: Invalid ID token' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ skipped: true, reason: 'Admin not configured' }, { status: 200 });
    }

    const body = await request.json();
    const { token, broadcast, link = '/', icon = null, image = null, tag = null } = body || {};

    if (!token && !broadcast) {
      return NextResponse.json({ error: 'FCM token or broadcast flag required' }, { status: 400 });
    }

    // 3. Authorization check: Broadcast is RESTRICTED to verified admins
    if (broadcast && !isCallerAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can broadcast push notifications' },
        { status: 403 }
      );
    }

    // 4. Validate & Sanitize Notification Text
    const safeTitle = sanitizeText(body.title, 100) || 'New Notification';
    const safeBody = sanitizeText(body.body, 500) || '';
    const safeLink = (link && typeof link === 'string' && link.startsWith('/')) ? link : '/';

    const host = request.headers.get('host') || 'afroedugo.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const iconUrl = icon || `${baseUrl}/icon-192.png`;

    const baseMessage = {
      data: {
        title: safeTitle,
        body: safeBody,
        icon: iconUrl,
        badge: `${baseUrl}/icon-192.png`,
        image: image || '',
        tag: tag || '',
        link: safeLink
      },
      android: {
        priority: 'high'
      },
      webpush: {
        headers: {
          Urgency: 'high'
        }
      }
    };

    if (broadcast) {
      const usersSnap = await admin.firestore().collection('users').get();
      const tokens = [];
      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.fcmToken) {
          tokens.push(data.fcmToken);
        }
      });

      if (tokens.length === 0) {
        return NextResponse.json({ skipped: true, reason: 'No users have FCM tokens' });
      }

      const message = {
        ...baseMessage,
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      return NextResponse.json({ success: true, responses: response });
    } else {
      const message = {
        ...baseMessage,
        token,
      };
      const response = await admin.messaging().send(message);
      return NextResponse.json({ success: true, messageId: response });
    }

  } catch (err) {
    if (err.code === 'messaging/registration-token-not-registered') {
      return NextResponse.json({ skipped: true, reason: 'Token expired' }, { status: 200 });
    }
    logger.error('Error sending push notification:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
