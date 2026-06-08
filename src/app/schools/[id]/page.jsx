import React from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import SchoolDetailClient from './SchoolDetailClient';

// Enable Incremental Static Regeneration (ISR) - revalidate every 1 hour
export const revalidate = 3600;

// Dynamic Metadata Generation for SEO Previews
export async function generateMetadata({ params }) {
  const { id } = await params;
  
  try {
    const docRef = doc(db, 'schools', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        title: 'School Not Found - AfroEduGo',
        description: 'The requested educational institution could not be found.',
      };
    }

    const school = docSnap.data();
    const cleanTitle = `${school.name} - Study in ${school.country} | AfroEduGo`;
    const cleanDesc = `Explore degrees at ${school.name} in ${school.location}. Tuition: ${school.tuition || 'Affordable'}. Connect directly via WhatsApp to enroll.`;

    return {
      title: cleanTitle,
      description: cleanDesc,
      openGraph: {
        title: `${school.name} | Study in Europe`,
        description: cleanDesc,
        images: school.imageUrl ? [{ url: school.imageUrl }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: cleanTitle,
        description: cleanDesc,
        images: school.imageUrl ? [school.imageUrl] : [],
      }
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return {
      title: 'Study in Europe - AfroEduGo',
    };
  }
}

function serializeFirestore(data) {
  if (!data) return null;
  const serialized = {};
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === 'object' && typeof val.toDate === 'function') {
      serialized[key] = val.toDate().toISOString();
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}

export default async function SchoolDetailPage({ params }) {
  const { id } = await params;
  
  let school = null;
  try {
    const docRef = doc(db, 'schools', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      school = { ...serializeFirestore(docSnap.data()), id: docSnap.id };
    }
  } catch (err) {
    console.error("Error fetching school details:", err);
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">School Not Found</h1>
        <p className="text-gray-500 font-bold text-sm mb-6">The school listing you are looking for does not exist or was removed.</p>
        <a href="/schools" className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">
          Back to School Finder
        </a>
      </div>
    );
  }

  return <SchoolDetailClient school={school} />;
}
