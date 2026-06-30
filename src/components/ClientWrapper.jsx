'use client';

import React, { useState, useEffect } from 'react';
import { GlobalStateProvider, useGlobalState } from '../context/GlobalStateContext';
import { ThemeProvider } from '../context/ThemeContext';
import ChatDrawer from './ChatDrawer';
import ViralJoinModal from './ViralJoinModal';
import NotificationPromptModal from './NotificationPromptModal';
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

  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  // Register device for FCM push notifications (background alerts)
  const { triggerRequest } = usePushNotifications();

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    // Check if user has already been prompted
    const hasPrompted = localStorage.getItem('afroedugo_notif_prompted');
    
    // Only show custom modal if they haven't decided yet (permission is default)
    if (Notification.permission === 'default' && hasPrompted !== 'true') {
      const timer = setTimeout(() => {
        setShowNotifPrompt(true);
      }, 2000); // 2 second delay for better UX
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleConfirmNotifications = async () => {
    setShowNotifPrompt(false);
    localStorage.setItem('afroedugo_notif_prompted', 'true');
    await triggerRequest();
  };

  const handleCancelNotifications = () => {
    setShowNotifPrompt(false);
    localStorage.setItem('afroedugo_notif_prompted', 'true');
  };

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

      {/* Notification Opt-in Prompt Modal */}
      <NotificationPromptModal 
        isOpen={showNotifPrompt}
        onConfirm={handleConfirmNotifications}
        onCancel={handleCancelNotifications}
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
