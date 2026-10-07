import { NextResponse } from 'next/server';
import admin from '@/firebase/adminConfig';
import { Resend } from 'resend';
import { generateCommunityBroadcastEmail } from '@/utils/emailTemplates/communityBroadcastEmail';
import { verifySignedPayload } from '@/utils/sessionSecurity';
import { checkRateLimit, getClientIp } from '@/utils/rateLimiter';
import { sanitizeText } from '@/utils/validators';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'ekpeprinceesor@gmail.com';
const INTERNAL_SECRET = process.env.CRON_SECRET || 'afroedugo-internal-secret-broadcaster-39105';

/**
 * POST /api/community/broadcast
 * Serverless broadcast endpoint for new community discussions & seed posts.
 * 
 * Pipeline:
 * 1. Security & Authentication (ID Token, __session cookie, or Admin Token)
 * 2. In-App Notification Fan-Out (Batch writes to 'notifications' collection)
 * 3. Web Push Fan-Out (Leverages /api/notify FCM broadcaster)
 * 4. Email Broadcast Engine (Resend Batch API in chunks of 50)
 */
export async function POST(request) {
  try {
    // 1. Rate limiting
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`community-broadcast:${ip}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many broadcast requests. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 2. Security & Authentication check
    let authenticatedUser = null;
    let isCallerAdmin = false;

    const authHeader = request.headers.get('Authorization');
    const adminTokenHeader = request.headers.get('x-admin-token');
    const internalSecretHeader = request.headers.get('x-internal-secret');

    // Check direct secret
    if (
      (adminTokenHeader && adminTokenHeader === process.env.ADMIN_TOKEN) ||
      (internalSecretHeader && internalSecretHeader === INTERNAL_SECRET)
    ) {
      isCallerAdmin = true;
      authenticatedUser = { uid: 'system-admin', email: ADMIN_EMAIL, isAdmin: true };
    }

    // Check Bearer token
    if (!authenticatedUser && authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      if (admin.apps.length) {
        try {
          const decoded = await admin.auth().verifyIdToken(idToken);
          authenticatedUser = decoded;
          isCallerAdmin = decoded.admin === true || 
            (decoded.email_verified && decoded.email?.toLowerCase() === ADMIN_EMAIL);
        } catch (authErr) {
          logger.warn('Broadcast token verification failed:', authErr.message);
        }
      }
    }

    // Check __session cookie
    if (!authenticatedUser) {
      const sessionCookie = request.cookies.get('__session')?.value;
      if (sessionCookie) {
        const payload = verifySignedPayload(sessionCookie);
        if (payload && payload.uid) {
          authenticatedUser = payload;
          isCallerAdmin = payload.isAdmin === true || 
            (payload.email && payload.email.toLowerCase() === ADMIN_EMAIL);
        }
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to trigger broadcast' },
        { status: 401 }
      );
    }

    // 3. Parse and validate payload
    const body = await request.json();
    const {
      postId = '',
      title = '',
      text = '',
      category = 'General',
      authorName = 'A fellow student',
      isSeedPost = false
    } = body || {};

    if (isSeedPost && !isCallerAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can trigger seed post broadcasts' },
        { status: 403 }
      );
    }

    if (!text && !title) {
      return NextResponse.json(
        { error: 'Post title or content is required for broadcast' },
        { status: 400 }
      );
    }

    const safeTitle = sanitizeText(title, 120) || 'New Community Discussion';
    const safeText = sanitizeText(text, 1000) || '';
    const safeCategory = sanitizeText(category, 50) || 'General';
    const safeAuthor = sanitizeText(authorName, 80) || 'A fellow student';
    const postSnippet = safeText.length > 200 ? `${safeText.slice(0, 200)}...` : safeText;

    if (!admin.apps.length) {
      return NextResponse.json(
        { skipped: true, reason: 'Firebase Admin not configured' },
        { status: 200 }
      );
    }

    const firestore = admin.firestore();

    // 4. Query Registered Users
    const usersSnap = await firestore.collection('users').get();
    const allUsers = [];
    usersSnap.forEach(doc => {
      allUsers.push({ id: doc.id, ...doc.data() });
    });

    // 5. In-App Notification Fan-Out
    // Create notifications with fields: { userId, title, message, link: '/community', read: false, createdAt: serverTimestamp() }
    const inAppTitle = `New topic in #${safeCategory}`;
    const inAppMessage = `${safeAuthor}: "${safeTitle}"`;
    const inAppLink = '/community';
    
    // We notify registered users (skip the author if not a seed post)
    const targetUsersForInApp = allUsers.filter(u => {
      if (!isSeedPost && authenticatedUser?.uid && u.id === authenticatedUser.uid) {
        return false;
      }
      return true;
    });

    let inAppInsertedCount = 0;
    const batchSize = 400; // Under Firestore's 500 max limit
    for (let i = 0; i < targetUsersForInApp.length; i += batchSize) {
      const userChunk = targetUsersForInApp.slice(i, i + batchSize);
      const batch = firestore.batch();

      userChunk.forEach(u => {
        const notifRef = firestore.collection('notifications').doc();
        batch.set(notifRef, {
          userId: u.id,
          title: inAppTitle,
          message: inAppMessage,
          link: inAppLink,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        inAppInsertedCount++;
      });

      await batch.commit();
    }

    // 6. Web Push Fan-Out
    // Leverage existing FCM broadcaster at /api/notify/route.js
    let webPushResult = null;
    try {
      const host = request.headers.get('host') || 'www.afroedugo.com';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const notifyUrl = `${protocol}://${host}/api/notify`;

      const pushPayload = {
        broadcast: true,
        title: `AfroEduGo Community: #${safeCategory}`,
        body: `${safeAuthor}: "${safeTitle}"`,
        link: '/community',
        tag: `post-${postId || Date.now()}`
      };

      const pushResponse = await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': INTERNAL_SECRET,
          'Authorization': authHeader || ''
        },
        body: JSON.stringify(pushPayload)
      });

      if (pushResponse.ok) {
        webPushResult = await pushResponse.json();
      } else {
        logger.warn('Direct fetch to /api/notify returned status:', pushResponse.status);
      }
    } catch (pushErr) {
      logger.warn('FCM broadcaster dispatch call failed, attempting fallback:', pushErr.message);
      // Fallback: direct multicast if tokens exist
      try {
        const tokens = allUsers.map(u => u.fcmToken).filter(Boolean);
        if (tokens.length > 0) {
          const fallbackMsg = {
            data: {
              title: `AfroEduGo Community: #${safeCategory}`,
              body: `${safeAuthor}: "${safeTitle}"`,
              link: '/community'
            },
            tokens
          };
          webPushResult = await admin.messaging().sendEachForMulticast(fallbackMsg);
        }
      } catch (fallbackErr) {
        logger.warn('FCM fallback multicast failed:', fallbackErr.message);
      }
    }

    // 7. Email Broadcast Engine
    // Query active users whose emailPreferences.communityUpdates !== false
    const emailRecipients = allUsers.filter(u => {
      const email = u.email;
      if (!email || !email.includes('@')) return false;
      // Filter by emailPreferences.communityUpdates !== false
      if (u.emailPreferences && u.emailPreferences.communityUpdates === false) {
        return false;
      }
      return true;
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    const fromSender = process.env.RESEND_FROM_EMAIL || 'AfroEduGo Community <community@afroedugo.com>';

    let emailsDispatchedCount = 0;
    const emailChunkSize = 50;

    for (let i = 0; i < emailRecipients.length; i += emailChunkSize) {
      const chunk = emailRecipients.slice(i, i + emailChunkSize);
      const emailBatch = chunk.map(recipient => ({
        from: fromSender,
        to: recipient.email,
        subject: `New Discussion: ${safeTitle}`,
        html: generateCommunityBroadcastEmail({
          studentName: recipient.displayName || recipient.name || recipient.email.split('@')[0] || 'Student',
          postTitle: safeTitle,
          postSnippet: postSnippet,
          categoryName: safeCategory,
          authorName: safeAuthor,
          postId: postId || ''
        })
      }));

      if (resend) {
        try {
          await resend.batch.send(emailBatch);
          emailsDispatchedCount += chunk.length;
        } catch (resendErr) {
          logger.error('Resend batch send chunk error:', resendErr.message);
        }
      } else {
        logger.warn(`RESEND_API_KEY not set. Simulated batch email dispatch for ${chunk.length} recipients.`);
        emailsDispatchedCount += chunk.length;
      }
    }

    return NextResponse.json({
      success: true,
      postId,
      inAppNotificationsInserted: inAppInsertedCount,
      webPushDispatched: Boolean(webPushResult),
      emailsBatched: emailsDispatchedCount,
      totalEligibleStudents: allUsers.length
    });

  } catch (err) {
    logger.error('Community broadcast engine fatal error:', err.message);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
