'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ServicesScreen from '../../screens/ServicesScreen';

export default function ServicesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <ServicesScreen onBack={() => router.push('/')} />
    </div>
  );
}
