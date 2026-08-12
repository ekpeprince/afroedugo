'use client';

import React, { useState, useEffect } from 'react';
import { GlobalStateProvider, useGlobalState } from '../context/GlobalStateContext';
import { ThemeProvider } from '../context/ThemeContext';
import ChatDrawer from './ChatDrawer';
import ViralJoinModal from './ViralJoinModal';
import NotificationPromptModal from './NotificationPromptModal';
import InstallPromptModal from './InstallPromptModal';
import { useAuth } from '../hooks/useAuth';
import NotificationManager from './NotificationManager';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { db } from '../firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

function GlobalModalsContainer({ children }) {
  const { user } = useAuth();
  const {
    activeConversationId,
    setActiveConversationId,
    showViralModal,
    setShowViralModal,
    deferredPrompt,
    installPWA
  } = useGlobalState();

  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Register device for FCM push notifications (background alerts)
  const { triggerRequest } = usePushNotifications();

  // Manage User Presence
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    const setOnline = () => {
      setDoc(userRef, { status: 'online', lastOnline: serverTimestamp() }, { merge: true })
        .catch(err => console.error("Error setting presence to online:", err));
    };

    const setOffline = () => {
      setDoc(userRef, { status: 'offline', lastOnline: serverTimestamp() }, { merge: true })
        .catch(err => console.error("Error setting presence to offline:", err));
    };

    setOnline();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setOnline();
      } else {
        setOffline();
      }
    };

    // Heartbeat interval every 3 minutes
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setOnline();
      }
    }, 3 * 60 * 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', setOffline);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', setOffline);
    };
  }, [user]);

  // PWA Install Prompt Effect
  useEffect(() => {
    if (!deferredPrompt) return;
    if (typeof window === 'undefined') return;

    // Check if user has already been prompted to install PWA
    const hasPromptedPWA = localStorage.getItem('afroedugo_pwa_install_prompted');
    
    if (hasPromptedPWA !== 'true') {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000); // 3 second delay for better UX
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt]);

  // Notifications Opt-in Prompt Effect
  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    // Check if user has already been prompted for notifications
    const hasPromptedNotif = localStorage.getItem('afroedugo_notif_prompted');
    
    // Only show custom notification modal if they haven't decided yet, and we aren't showing the PWA modal
    if (Notification.permission === 'default' && hasPromptedNotif !== 'true' && !showInstallPrompt) {
      const timer = setTimeout(() => {
        setShowNotifPrompt(true);
      }, 2000); // 2 second delay for better UX
      return () => clearTimeout(timer);
    }
  }, [user, showInstallPrompt]);

  const handleConfirmNotifications = async () => {
    setShowNotifPrompt(false);
    localStorage.setItem('afroedugo_notif_prompted', 'true');
    await triggerRequest();
  };

  const handleCancelNotifications = () => {
    setShowNotifPrompt(false);
    localStorage.setItem('afroedugo_notif_prompted', 'true');
  };

  const handleConfirmInstall = async () => {
    setShowInstallPrompt(false);
    localStorage.setItem('afroedugo_pwa_install_prompted', 'true');
    await installPWA();
  };

  const handleCancelInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('afroedugo_pwa_install_prompted', 'true');
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

      {/* PWA Install Prompt Modal */}
      <InstallPromptModal 
        isOpen={showInstallPrompt}
        onConfirm={handleConfirmInstall}
        onCancel={handleCancelInstall}
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
