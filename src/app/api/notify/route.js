import { NextResponse } from 'next/server';
import admin from '../../../firebase/adminConfig';

/**
 * POST /api/notify
 * Body: { token: string, title: string, body: string, link?: string }
 *
 * Sends an FCM push notification to the device identified by `token`.
 * Requires Firebase Admin credentials in .env.local.
 */
export async function POST(request) {
  try {
    const { token, title, body, link = '/' } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'FCM token required' }, { status: 400 });
    }

    // If Admin SDK is not initialised (missing credentials), skip gracefully
    if (!admin.apps.length) {
      return NextResponse.json({ skipped: true, reason: 'Admin not configured' }, { status: 200 });
    }

    const message = {
      token,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          requireInteraction: false,
        },
        fcmOptions: {
          link,
        },
      },
    };

    const response = await admin.messaging().send(message);
    return NextResponse.json({ success: true, messageId: response });
  } catch (err) {
    // Token might be expired/invalid — not a fatal error
    if (err.code === 'messaging/registration-token-not-registered') {
      return NextResponse.json({ skipped: true, reason: 'Token expired' }, { status: 200 });
    }
    console.error('[/api/notify] Error sending push:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
