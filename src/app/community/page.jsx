'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CommunityScreen from '../../screens/CommunityScreen';
import { useGlobalState } from '../../context/GlobalStateContext';

export default function CommunityPage() {
  const router = useRouter();
  const { openChat } = useGlobalState();

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <CommunityScreen 
        onBack={() => router.push('/')} 
        onOpenChat={openChat}
      />
    </div>
  );
}
