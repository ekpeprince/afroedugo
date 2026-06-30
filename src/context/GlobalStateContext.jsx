'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const GlobalStateContext = createContext();

export function GlobalStateProvider({ children }) {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showViralModal, setShowViralModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const openChat = (convId) => {
    setActiveConversationId(convId);
  };

  const installPWA = async () => {
    if (!deferredPrompt) return false;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Clear deferredPrompt since it can only be used once
    setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  return (
    <GlobalStateContext.Provider value={{
      activeConversationId,
      setActiveConversationId,
      showViralModal,
      setShowViralModal,
      openChat,
      deferredPrompt,
      setDeferredPrompt,
      installPWA
    }}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}
