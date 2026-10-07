'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProfileScreen from '../../screens/ProfileScreen';
import { useGlobalState } from '../../context/GlobalStateContext';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { setShowViralModal } = useGlobalState();
  const [unsubscribeMessage, setUnsubscribeMessage] = useState(null);

  const isUnsubscribe = searchParams?.get('unsubscribe') === 'community' || searchParams?.get('action') === 'unsubscribe';

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [user, loading, router]);

  // Handle direct unsubscribe query from email notification links
  useEffect(() => {
    if (user && isUnsubscribe && profile) {
      if (profile.emailPreferences?.communityUpdates !== false) {
        updateProfile({
          emailPreferences: {
            ...(profile.emailPreferences || {}),
            communityUpdates: false
          }
        }).then(() => {
          setUnsubscribeMessage('You have been unsubscribed from community discussion email alerts.');
        });
      } else {
        setUnsubscribeMessage('You are currently unsubscribed from community discussion email alerts.');
      }
    }
  }, [user, isUnsubscribe, profile, updateProfile]);

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
      {unsubscribeMessage && (
        <div className="max-w-4xl mx-auto pt-6 px-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">✓</span>
              <span>{unsubscribeMessage}</span>
            </div>
            <button
              onClick={() => setUnsubscribeMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <ProfileScreen 
        onBack={() => router.push('/')} 
        onLogout={handleLogout}
        onShowViralModal={() => setShowViralModal(true)}
        onNavigate={(screen) => router.push(screen.startsWith('/') ? screen : `/${screen}`)}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
