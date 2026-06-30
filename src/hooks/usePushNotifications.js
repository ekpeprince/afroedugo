'use client';

import { useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';

/**
 * Registers the device for Firebase Cloud Messaging push notifications.
 *
 * Flow:
 *  1. Ask the browser for notification permission.
 *  2. Get the FCM token using the VAPID public key.
 *  3. Save the token to the user's Firestore document (users/{uid}.fcmToken).
 *
 * The token is used server-side (/api/notify) to send targeted push messages
 * even when the app tab is closed (handled by firebase-messaging-sw.js).
 *
 * Required env var: NEXT_PUBLIC_FIREBASE_VAPID_KEY
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!user || registered.current) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[usePushNotifications] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set. Push notifications will not work.');
      return;
    }

    async function register() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Dynamically import to avoid SSR issues
        const { getMessaging, getToken } = await import('firebase/messaging');
        const { app } = await import('../firebase/config');

        const messaging = getMessaging(app);
        const token = await getToken(messaging, { vapidKey });

        if (token) {
          await setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
          registered.current = true;
          console.log('[usePushNotifications] FCM token registered ✓');
        }
      } catch (err) {
        console.warn('[usePushNotifications] Registration failed:', err?.message);
      }
    }

    register();
  }, [user]);
}
