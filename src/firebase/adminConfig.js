/**
 * Firebase Admin SDK — server-side only.
 * Used by Next.js API routes to send FCM push notifications.
 *
 * Required environment variables (set in .env.local, NOT prefixed with NEXT_PUBLIC_):
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY   (copy the entire "private_key" value from your service account JSON)
 */
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  const credentialsReady =
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    privateKey &&
    privateKey.startsWith('-----BEGIN'); // guard against placeholder values

  if (credentialsReady) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey,
        }),
      });
    } catch (err) {
      console.warn('[adminConfig] Firebase Admin init failed:', err?.message);
    }
  } else {
    // Credentials not yet configured — push notifications will be skipped gracefully
    if (process.env.NODE_ENV !== 'test') {
      console.info(
        '[adminConfig] Firebase Admin credentials not set. ' +
        'Add FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY to .env.local to enable push notifications.'
      );
    }
  }
}

export default admin;

