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
    // 1. Authenticate caller with Firebase ID Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing bearer token' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];

    if (admin.apps.length) {
      try {
        await admin.auth().verifyIdToken(idToken);
      } catch (authErr) {
        return NextResponse.json({ error: 'Unauthorized: Invalid ID token' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ skipped: true, reason: 'Admin not configured' }, { status: 200 });
    }

    const { token, title, body, link = '/' } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'FCM token required' }, { status: 400 });
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
