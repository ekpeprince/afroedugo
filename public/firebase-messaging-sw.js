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

// ── Custom Background Message Handler ──
// By intercepting data-only messages, we take 100% control of how the notification
// looks (badge, icon, tag, vibrate) and behaves on Android, bypassing Firebase's default.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  if (!payload.data) return;

  const { title, body, icon, badge, image, tag, link } = payload.data;

  const notificationOptions = {
    body: body,
    icon: icon,
    badge: badge,
    image: image || undefined,
    tag: tag || undefined,
    renotify: !!tag,
    data: { link: link || '/' },
    vibrate: [200, 100, 200, 100, 200], // Custom vibration pattern
    requireInteraction: false
  };

  return self.registration.showNotification(title, notificationOptions);
});

// ── Notification Click Handler ──
// Handles focusing or opening the app when the user taps the notification
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);
  event.notification.close();

  const targetUrl = event.notification.data && event.notification.data.link 
    ? new URL(event.notification.data.link, self.location.origin).href
    : self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open with the app, focus it and navigate
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
