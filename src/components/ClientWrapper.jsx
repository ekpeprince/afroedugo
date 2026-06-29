'use client';

import React from 'react';
import { GlobalStateProvider, useGlobalState } from '../context/GlobalStateContext';
import { ThemeProvider } from '../context/ThemeContext';
import ChatDrawer from './ChatDrawer';
import ViralJoinModal from './ViralJoinModal';
import { useAuth } from '../hooks/useAuth';
import NotificationManager from './NotificationManager';
import { usePushNotifications } from '../hooks/usePushNotifications';

function GlobalModalsContainer({ children }) {
  const { user } = useAuth();
  const {
    activeConversationId,
    setActiveConversationId,
    showViralModal,
    setShowViralModal
  } = useGlobalState();

  // Register device for FCM push notifications (background alerts)
  usePushNotifications();

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
    <ThemeProvider>
      <GlobalStateProvider>
        <GlobalModalsContainer>
          {children}
        </GlobalModalsContainer>
      </GlobalStateProvider>
    </ThemeProvider>
  );
}
