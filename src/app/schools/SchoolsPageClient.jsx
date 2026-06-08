'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import SchoolFinder from '../../screens/SchoolFinder';

export default function SchoolsPageClient({ initialSchools }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <SchoolFinder onBack={() => router.push('/')} initialSchools={initialSchools} />
    </div>
  );
}
