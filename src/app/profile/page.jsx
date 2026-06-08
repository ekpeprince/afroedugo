'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProfileScreen from '../../screens/ProfileScreen';
import { useGlobalState } from '../../context/GlobalStateContext';

export default function ProfilePage() {
  const router = useRouter();
  const { setShowViralModal } = useGlobalState();

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <ProfileScreen 
        onBack={() => router.push('/')} 
        onLogout={handleLogout}
        onShowViralModal={() => setShowViralModal(true)}
        onNavigate={(screen) => router.push(`/${screen}`)}
      />
    </div>
  );
}
