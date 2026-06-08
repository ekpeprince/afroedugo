import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import HousingPageClient from './HousingPageClient';

export default async function HousingPage() {
  let initialHousing = [];
  try {
    const querySnapshot = await getDocs(collection(db, 'housing'));
    initialHousing = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const serialized = {};
      for (const [key, val] of Object.entries(data)) {
        if (val && typeof val === 'object' && typeof val.toDate === 'function') {
          serialized[key] = val.toDate().toISOString();
        } else {
          serialized[key] = val;
        }
      }
      return { ...serialized, id: doc.id };
    });
  } catch (err) {
    console.error("Error fetching housing for SSR:", err);
  }

  return <HousingPageClient initialHousing={initialHousing} />;
}
