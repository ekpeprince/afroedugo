'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WelcomeScreen from '../screens/WelcomeScreen';
import MainMenu from '../screens/MainMenu';
import { useAuth } from '../hooks/useAuth';
import { useGlobalState } from '../context/GlobalStateContext';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [hasRecoveredSession, setHasRecoveredSession] = useState(false);

  // Auto-recovery of session: if user is logged in, skip welcome screen
  useEffect(() => {
    if (!authLoading && user && !hasRecoveredSession) {
      setShowMenu(true);
      setHasRecoveredSession(true);
    }
  }, [user, authLoading, hasRecoveredSession]);

  const handleNavigate = (screen) => {
    // Map screen strings to paths
    if (screen === 'add-listing') {
      router.push('/add-listing');
    } else {
      router.push(`/${screen}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      {!showMenu ? (
        <WelcomeScreen onStart={() => setShowMenu(true)} />
      ) : (
        <>
          <MainMenu onNavigate={handleNavigate} />

          {/* Bottom Profile Anchor (Visible on Menu) */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
            <button 
              onClick={() => router.push(user ? '/chat' : '/auth')}
              className="bg-white/80 backdrop-blur-md w-14 h-14 rounded-full shadow-lg border border-gray-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <span className="text-xl">💬</span>
            </button>
            
            <button 
              onClick={() => router.push(user ? '/profile' : '/auth')}
              className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-gray-100 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-full h-full object-cover" />
                ) : (
                  user?.email ? user.email[0].toUpperCase() : '?'
                )}
              </div>
              <span className="font-black text-xs uppercase tracking-widest text-gray-700">
                {user ? 'My Profile' : 'Login / Join'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
