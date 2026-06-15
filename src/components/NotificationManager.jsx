'use client';

import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function NotificationManager() {
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const router = useRouter();
  const initialized = useRef(false);
  const previousNotificationsCount = useRef(0);
  const mountTime = useRef(Date.now());

  // 1. Request notification permission on user login
  useEffect(() => {
    if (!user) return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('AfroEduGo desktop notifications enabled.');
          }
        });
      }
    }
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
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const systemNotification = new Notification(n.title || '🔔 AfroEduGo Alert', {
              body: n.message || 'You received a new update.',
              icon: '/icon-192.png',
              tag: n.id,
              renotify: true
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
