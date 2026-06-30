'use client';

import { useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';

/**
 * Registers the device for Firebase Cloud Messaging push notifications.
 *
 * Flow:
 *  1. Only auto-registers token if permission is already granted.
 *  2. Exposes a triggerRequest function to request permission and register.
 *
 * Required env var: NEXT_PUBLIC_FIREBASE_VAPID_KEY
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const registered = useRef(false);

  const registerToken = async () => {
    if (!user || registered.current) return;
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) return;

    try {
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
  };

  useEffect(() => {
    if (!user || registered.current) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[usePushNotifications] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set. Push notifications will not work.');
      return;
    }

    // Automatically sync token if permission is already granted
    if (Notification.permission === 'granted') {
      registerToken();
    }
  }, [user]);

  const triggerRequest = async () => {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await registerToken();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[usePushNotifications] Permission request failed:', err);
      return false;
    }
  };

  return { triggerRequest };
}
