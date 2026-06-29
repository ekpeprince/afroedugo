import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Sends a push notification to a user via the /api/notify route.
 * Looks up the target user's FCM token from Firestore, then fires the push.
 *
 * @param {string} targetUserId  - UID of the user to notify
 * @param {string} title         - Notification title
 * @param {string} body          - Notification body text
 * @param {string} [link='/']    - URL to open when the notification is clicked
 */
export async function notifyUser(targetUserId, title, body, link = '/') {
  if (!targetUserId) return;
  try {
    const userSnap = await getDoc(doc(db, 'users', targetUserId));
    const token = userSnap.data()?.fcmToken;
    if (!token) return; // user hasn't granted push permission yet

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title, body, link }),
    });
  } catch (err) {
    // Non-critical — silently fail (push is best-effort)
    console.warn('Push notification failed:', err?.message);
  }
}
