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

// ── Firebase handles background messages automatically if payload contains `notification` ──
// We do not need a custom onBackgroundMessage or notificationclick listener 
// because Firebase uses the webpush options (including fcmOptions.link) sent by the server.
