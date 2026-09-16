'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/community');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111b21] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
