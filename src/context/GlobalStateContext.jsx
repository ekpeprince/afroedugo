'use client';

import React, { createContext, useContext, useState } from 'react';

const GlobalStateContext = createContext();

export function GlobalStateProvider({ children }) {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showViralModal, setShowViralModal] = useState(false);

  const openChat = (convId) => {
    setActiveConversationId(convId);
  };

  return (
    <GlobalStateContext.Provider value={{
      activeConversationId,
      setActiveConversationId,
      showViralModal,
      setShowViralModal,
      openChat
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
