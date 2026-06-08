import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import SchoolsPageClient from './SchoolsPageClient';

export default async function SchoolsPage() {
  let initialSchools = [];
  try {
    const querySnapshot = await getDocs(collection(db, 'schools'));
    initialSchools = querySnapshot.docs.map(doc => {
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
    console.error("Error fetching schools for SSR:", err);
  }

  return <SchoolsPageClient initialSchools={initialSchools} />;
}
