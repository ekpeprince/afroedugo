import React from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import HousingDetailClient from './HousingDetailClient';

// Server-Side Rendering (SSR) for dynamic housing listings
export const dynamic = 'force-dynamic';

// Dynamic Metadata Generation for SEO Previews
export async function generateMetadata({ params }) {
  const { id } = await params;
  
  try {
    const docRef = doc(db, 'housing', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        title: 'Housing Listing Not Found - AfroEduGo',
        description: 'The requested student housing listing could not be found.',
      };
    }

    const item = docSnap.data();
    const cleanTitle = `${item.title} | Student Housing in Europe`;
    const cleanDesc = `Rent: ${item.price || 'Affordable'}. Located in ${item.location}. Explore details, contact host, and submit inquiries on AfroEduGo.`;

    return {
      title: cleanTitle,
      description: cleanDesc,
      openGraph: {
        title: cleanTitle,
        description: cleanDesc,
        images: item.imageUrl ? [{ url: item.imageUrl }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: cleanTitle,
        description: cleanDesc,
        images: item.imageUrl ? [item.imageUrl] : [],
      }
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return {
      title: 'Student Housing in Europe - AfroEduGo',
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

export default async function HousingDetailPage({ params }) {
  const { id } = await params;
  
  let item = null;
  try {
    const docRef = doc(db, 'housing', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      item = { ...serializeFirestore(docSnap.data()), id: docSnap.id };
    }
  } catch (err) {
    console.error("Error fetching housing details:", err);
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-4">🏠</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Listing Not Found</h1>
        <p className="text-gray-500 font-bold text-sm mb-6">The housing listing you are looking for does not exist or has been rented out.</p>
        <a href="/housing" className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">
          Back to Housing Finder
        </a>
      </div>
    );
  }

  return <HousingDetailClient item={item} />;
}
