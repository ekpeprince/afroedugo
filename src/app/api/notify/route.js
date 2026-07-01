import { NextResponse } from 'next/server';
import admin from '../../../firebase/adminConfig';

/**
 * POST /api/notify
 * Body: { token?: string, broadcast?: boolean, title: string, body: string, link?: string }
 *
 * Sends an FCM push notification to the device identified by `token`,
 * or to all users with `fcmToken` if `broadcast` is true.
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

    const { token, broadcast, title, body, link = '/', icon = null, image = null, tag = null } = await request.json();

    if (!token && !broadcast) {
      return NextResponse.json({ error: 'FCM token or broadcast flag required' }, { status: 400 });
    }

    const host = request.headers.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // Use an absolute URL for the icon, otherwise Android Web Push fails to load it
    const iconUrl = icon || `${baseUrl}/icon-192.png`;

    // By using 'data' instead of 'notification', we prevent FCM from auto-displaying it,
    // allowing our Service Worker to render it with 100% custom styling (badge, image, vibration).
    const baseMessage = {
      data: {
        title: title || 'New Notification',
        body: body || '',
        icon: iconUrl || '',
        badge: `${baseUrl}/icon-192.png`,
        image: image || '',
        tag: tag || '',
        link: link || '/'
      },
      android: {
        priority: 'high' // Wakes up Android devices from Doze mode
      },
      webpush: {
        headers: {
          Urgency: 'high' // Tells browser push services this is time-sensitive
        }
      }
    };

    if (broadcast) {
      // Fetch all users with fcmToken
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
    console.error('[/api/notify] Error sending push:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
