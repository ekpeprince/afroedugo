'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AuthScreen from '../../screens/AuthScreen';

export default function AuthPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <AuthScreen 
        onBack={() => router.push('/')} 
        onAuthSuccess={() => router.push('/')} 
      />
    </div>
  );
}
