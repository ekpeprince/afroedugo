'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ChatScreen from '../../screens/ChatScreen';
import { useGlobalState } from '../../context/GlobalStateContext';

export default function ChatPage() {
  const router = useRouter();
  const { openChat } = useGlobalState();

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      <ChatScreen 
        onBack={() => router.push('/')} 
        onOpenChat={openChat}
      />
    </div>
  );
}
