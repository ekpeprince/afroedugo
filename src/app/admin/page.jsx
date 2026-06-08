'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '../../screens/AdminDashboard';

export default function AdminPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <AdminDashboard onBack={() => router.push('/profile')} />
    </div>
  );
}
