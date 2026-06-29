/**
 * firebase-messaging-sw.js
 *
 * Firebase Cloud Messaging service worker.
 * This file MUST be at the root of the public directory so the browser can
 * register it at the service worker scope origin.
 *
 * It handles:
 *  - Background push messages (when the app tab is closed / not focused)
 *  - Notification click → open/focus the app
 */

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// ── Firebase config (must be hardcoded; service workers cannot read env vars) ──
firebase.initializeApp({
  apiKey: 'AIzaSyBOr3R-Subxwq2HjZGB1v7Wz31ttkcJBpQ',
  authDomain: 'afroedugo-b0b3f.firebaseapp.com',
  projectId: 'afroedugo-b0b3f',
  storageBucket: 'afroedugo-b0b3f.firebasestorage.app',
  messagingSenderId: '86185831384',
  appId: '1:86185831384:web:1fffe955dcd6d044a9a0ad',
});

const messaging = firebase.messaging();

// ── Handle background messages ──────────────────────────────────────────────
messaging.onBackgroundMessage(function (payload) {
  const title = payload.notification?.title || 'AfroEduGo';
  const body  = payload.notification?.body  || 'You have a new update.';
  const link  = payload.fcmOptions?.link || payload.data?.link || '/';

  return self.registration.showNotification(title, {
    body,
    icon:          '/icon-192.png',
    badge:         '/icon-192.png',
    tag:           'afroedugo-' + Date.now(),
    renotify:      true,
    requireInteraction: false,
    data:          { link },
  });
});

// ── Handle notification click ────────────────────────────────────────────────
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const link = event.notification.data?.link || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // If a tab is already open, focus it and navigate
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.navigate(link);
            return;
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) return clients.openWindow(link);
      })
  );
});
