'use client';

import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { db, messaging } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';

const playChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playNote = (time, freq, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0, time);
      // Soft curves prevent clipping click noise
      gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = ctx.currentTime;
    // Ascending major chord chime (D5 -> A5 -> D6)
    playNote(now, 587.33, 0.4);       // D5
    playNote(now + 0.08, 880.00, 0.35);  // A5
    playNote(now + 0.16, 1174.66, 0.5);  // D6
  } catch (err) {
    console.warn('Web Audio chime playback failed:', err);
  }
};

export default function NotificationManager() {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const router = useRouter();
  const initialized = useRef(false);
  const previousNotificationsCount = useRef(0);
  const mountTime = useRef(Date.now());

  // 1. Request notification permission and get FCM token
  useEffect(() => {
    if (!user) return;

    const setupFCM = async () => {
      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted' && messaging) {
            console.log('AfroEduGo desktop notifications enabled.');
            
            // Get FCM Token
            const currentToken = await getToken(messaging, { 
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
            });
            
            if (currentToken) {
              // Save token to Firestore profile
              await updateDoc(doc(db, 'users', user.uid), {
                fcmToken: currentToken
              });
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          }
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };

    setupFCM();
  }, [user]);

  // 2. Watch for new notifications and trigger desktop OS banners
  useEffect(() => {
    if (!user || !notifications) {
      previousNotificationsCount.current = 0;
      return;
    }

    // If first fetch loads notifications, record counts and prevent historic spam
    if (!initialized.current && notifications.length > 0) {
      previousNotificationsCount.current = notifications.length;
      initialized.current = true;
      return;
    }

    if (!initialized.current) {
      initialized.current = true;
    }

    // Only alert when the notifications list grows
    if (notifications.length > previousNotificationsCount.current) {
      const newItems = notifications.filter(n => {
        let createdTime = Date.now();
        if (n.createdAt) {
          if (typeof n.createdAt.toDate === 'function') {
            createdTime = n.createdAt.toDate().getTime();
          } else {
            createdTime = new Date(n.createdAt).getTime();
          }
        }
        // Must be unread and newer than the initial mount time
        return !n.read && createdTime > mountTime.current - 5000;
      });

      newItems.forEach(n => {
        // Play the premium synthetic chime sound
        playChime();

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const systemNotification = new Notification(n.title || '🔔 AfroEduGo Alert', {
              body: n.message || 'You received a new update.',
              icon: '/icon-192.png',
              tag: n.id,
              renotify: true,
              vibrate: [100, 50, 100] // Double vibration
            });

            systemNotification.onclick = () => {
              window.focus();
              if (n.link) {
                router.push('/' + n.link);
              } else {
                router.push('/profile');
              }
              systemNotification.close();
            };
          } catch (err) {
            console.warn('Unable to show OS push notification:', err);
          }
        }
      });
    }

    previousNotificationsCount.current = notifications.length;
  }, [notifications, user, router]);

  return null;
}
