import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOr3R-Subxwq2HjZGB1v7Wz31ttkcJBpQ",
  authDomain: "afroedugo-b0b3f.firebaseapp.com",
  projectId: "afroedugo-b0b3f",
  storageBucket: "afroedugo-b0b3f.firebasestorage.app",
  messagingSenderId: "86185831384",
  appId: "1:86185831384:web:1fffe955dcd6d044a9a0ad"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Google Maps Configuration
// REPLACE WITH YOUR ACTUAL GOOGLE MAPS API KEY
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: failed-precondition');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence failed: unimplemented');
  }
});

export { app, db, storage, auth, GOOGLE_MAPS_API_KEY };
