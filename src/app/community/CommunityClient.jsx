'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CommunityScreen from '../../screens/CommunityScreen';
import { useGlobalState } from '../../context/GlobalStateContext';

export default function CommunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openChat } = useGlobalState();

  const targetPostId = searchParams?.get('postId') || null;
  const targetCommentId = searchParams?.get('commentId') || null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <CommunityScreen 
        targetPostId={targetPostId}
        targetCommentId={targetCommentId}
        onBack={() => router.push('/')} 
        onOpenChat={openChat}
        onOpenMessages={() => router.push('/chat')}
        onOpenNotifications={() => router.push('/notifications')}
        onLogin={() => router.push('/auth')}
      />
    </div>
  );
}
