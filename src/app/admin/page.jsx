'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '../../screens/AdminDashboard';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';

export default function AdminPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const { user, loading: authLoading } = useAuth();
  const [serverAuthorized, setServerAuthorized] = useState(null); // null = pending, true = ok, false = denied

  useEffect(() => {
    let isMounted = true;

    async function checkServerAuthorization() {
      if (!user) {
        if (isMounted) setServerAuthorized(false);
        return;
      }

      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) setServerAuthorized(data.authorized === true);
        } else {
          if (isMounted) setServerAuthorized(false);
        }
      } catch {
        if (isMounted) setServerAuthorized(false);
      }
    }

    if (!authLoading) {
      checkServerAuthorization();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const loading = authLoading || profileLoading || serverAuthorized === null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Verifying Server Security Credentials...</p>
      </div>
    );
  }

  // Double-check: Client-side role and Server-side authorization check must BOTH pass
  const isClientAuthorized = 
    profile?.role === 'admin' || 
    user?.email?.toLowerCase() === 'ekpeprinceesor@gmail.com';

  const isAuthorized = isClientAuthorized && serverAuthorized;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
        
        <div className="text-6xl mb-6 animate-bounce duration-[2000ms]">🛡️</div>
        
        <h1 className="text-3xl font-black tracking-tight text-white mb-2 leading-none">Access Denied</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-6">Restricted Control Room</p>
        
        <p className="text-gray-400 font-medium max-w-sm leading-relaxed mb-8 text-sm">
          You do not have administrative privileges to access this area. If you believe this is an error, please contact support.
        </p>

        <button 
          onClick={() => router.push('/')}
          className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center gap-2"
        >
          ← Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <AdminDashboard onBack={() => router.push('/')} />
    </div>
  );
}
