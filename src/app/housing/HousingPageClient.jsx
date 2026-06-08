'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import HousingFinder from '../../screens/HousingFinder';
import { useGlobalState } from '../../context/GlobalStateContext';

export default function HousingPageClient({ initialHousing }) {
  const router = useRouter();
  const { openChat } = useGlobalState();

  const handleNavigate = (screen) => {
    if (screen === 'add-listing') {
      router.push('/add-listing');
    } else {
      router.push(`/${screen}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <HousingFinder 
        onBack={() => router.push('/')} 
        onNavigate={handleNavigate}
        onOpenChat={openChat}
        initialHousing={initialHousing}
      />
    </div>
  );
}
