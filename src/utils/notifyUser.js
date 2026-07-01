import { db, auth } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Sends a push notification to a user via the /api/notify route.
 * Looks up the target user's FCM token from Firestore, then fires the push.
 *
 * @param {string} targetUserId  - UID of the user to notify
 * @param {string} title         - Notification title
 * @param {string} body          - Notification body text
 * @param {string} [link='/']    - URL to open when the notification is clicked
 * @param {string|null} [icon=null] - URL to an image/icon to display (e.g., sender's avatar)
 * @param {string|null} [image=null] - URL to an attached image to display (e.g., post picture or DM photo)
 */
export async function notifyUser(targetUserId, title, body, link = '/', icon = null, image = null) {
  if (!targetUserId) return;
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return; // User must be logged in to trigger notifications

    const userSnap = await getDoc(doc(db, 'users', targetUserId));
    const token = userSnap.data()?.fcmToken;
    if (!token) return; // user hasn't granted push permission yet

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ token, title, body, link, icon, image }),
    });
  } catch (err) {
    // Non-critical — silently fail (push is best-effort)
    console.warn('Push notification failed:', err?.message);
  }
}
