import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

// Auth Domain Configuration:
// The project's Google OAuth 2.0 Web Client is configured with https://afroedugo.com/__/auth/handler
// and https://www.afroedugo.com/__/auth/handler as authorized redirect URIs.
// Next.js rewrites /__/auth/* to Firebase, allowing first-party authentication on afroedugo.com.
const getAuthDomain = () => {
  if (typeof window !== "undefined" && window.location.hostname.includes("afroedugo.com")) {
    return window.location.hostname;
  }
  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "afroedugo.com";
};

// Web app's Firebase configuration with fallback values for SSR & CI builds
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBOr3R-Subxwq2HjZGB1v7Wz31ttkcJBpQ",
  authDomain: getAuthDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "afroedugo-b0b3f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "afroedugo-b0b3f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "86185831384",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:86185831384:web:1fffe955dcd6d044a9a0ad",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate required config fields
const missing = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value && key !== 'measurementId')
  .map(([key]) => key);

if (missing.length > 0) {
  throw new Error(`Missing required Firebase configuration: ${missing.join(', ')}`);
}

// Initialize Firebase (prevent duplicate initialization during Fast Refresh / SSR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
let analytics = null;
let messaging = null;

if (typeof window !== "undefined") {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});

  isMessagingSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch(() => {});
}

// Google Maps Configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBOr3R-Subxwq2HjZGB1v7Wz31ttkcJBpQ";

// Enable Offline Persistence (Client-only)
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: failed-precondition');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence failed: unimplemented');
    }
  });
}

export { app, db, storage, auth, analytics, messaging, GOOGLE_MAPS_API_KEY };
