'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AddListing from '../../screens/AddListing';

export default function AddListingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <AddListing onBack={() => router.push('/housing')} />
    </div>
  );
}
