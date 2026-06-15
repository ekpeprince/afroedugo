'use client';

import React from 'react';
import { GlobalStateProvider, useGlobalState } from '../context/GlobalStateContext';
import ChatDrawer from './ChatDrawer';
import ViralJoinModal from './ViralJoinModal';
import { useAuth } from '../hooks/useAuth';
import NotificationManager from './NotificationManager';

function GlobalModalsContainer({ children }) {
  const { user } = useAuth();
  const { 
    activeConversationId, 
    setActiveConversationId, 
    showViralModal, 
    setShowViralModal 
  } = useGlobalState();

  return (
    <>
      {children}

      {/* Real-time OS notifications */}
      <NotificationManager />

      {/* Real-time Chat Drawer */}
      <ChatDrawer 
        isOpen={!!activeConversationId} 
        onClose={() => setActiveConversationId(null)} 
        conversationId={activeConversationId} 
      />

      {/* Viral Referral Loop Modal */}
      <ViralJoinModal 
        isOpen={showViralModal} 
        onClose={() => setShowViralModal(false)} 
        userName={user?.displayName}
      />
    </>
  );
}

export default function ClientWrapper({ children }) {
  return (
    <GlobalStateProvider>
      <GlobalModalsContainer>
        {children}
      </GlobalModalsContainer>
    </GlobalStateProvider>
  );
}
