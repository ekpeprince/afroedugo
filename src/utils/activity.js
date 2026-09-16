import { doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Updates the user's lastActiveAt timestamp in Firestore.
 * Call this on session load, dashboard access, or active interactions.
 * 
 * @param {string} userId - Firebase Auth UID
 */
export async function recordUserActivity(userId) {
  if (!userId || !db) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      lastActiveAt: serverTimestamp(),
      lastOnline: serverTimestamp(),
      status: 'online'
    }, { merge: true });
  } catch (err) {
    console.error('[recordUserActivity] Error updating user activity:', err);
  }
}
