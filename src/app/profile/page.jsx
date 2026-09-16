'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProfileScreen from '../../screens/ProfileScreen';
import { useGlobalState } from '../../context/GlobalStateContext';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { setShowViralModal } = useGlobalState();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <ProfileScreen 
        onBack={() => router.push('/')} 
        onLogout={handleLogout}
        onShowViralModal={() => setShowViralModal(true)}
        onNavigate={(screen) => router.push(screen.startsWith('/') ? screen : `/${screen}`)}
      />
    </div>
  );
}
