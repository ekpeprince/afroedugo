import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration from config.js
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

// Helper to clear collection
import { getDocs, deleteDoc, doc } from "firebase/firestore";
const clearCollection = async (collectionName) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, collectionName, d.id)));
  await Promise.all(deletePromises);
};

// Load data.json
const dataPath = path.resolve(__dirname, '../data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Sample Images
const schoolImages = [
  "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?auto=format&fit=crop&q=80&w=800"
];

const housingImages = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1554995207-c18c20360a59?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800"
];

const serviceImages = [
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800"
];

const migrate = async () => {
  console.log('🚀 Starting Expansion Migration...');
  try {
    // Migrate Schools
    console.log('--- Migrating Schools ---');
    await clearCollection('schools');
    for (let i = 0; i < data.schools.length; i++) {
      const school = data.schools[i];
      await addDoc(collection(db, 'schools'), {
        ...school,
        imageUrl: schoolImages[i % schoolImages.length],
        createdAt: serverTimestamp()
      });
      console.log(`✅ Added: ${school.name} (${school.country})`);
    }

    // Migrate Housing
    console.log('--- Migrating Housing ---');
    await clearCollection('housing');
    for (let i = 0; i < data.housing.length; i++) {
      const house = data.housing[i];
      await addDoc(collection(db, 'housing'), {
        ...house,
        imageUrl: housingImages[i % housingImages.length],
        createdAt: serverTimestamp()
      });
      console.log(`✅ Added: ${house.title}`);
    }

    // Migrate Services
    console.log('--- Migrating Services ---');
    await clearCollection('services');
    for (let i = 0; i < data.services.length; i++) {
      const service = data.services[i];
      await addDoc(collection(db, 'services'), {
        ...service,
        imageUrl: serviceImages[i % serviceImages.length],
        createdAt: serverTimestamp()
      });
      console.log(`✅ Added: ${service.name}`);
    }

    console.log('✨ Migration completed successfully! Database expanded.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
