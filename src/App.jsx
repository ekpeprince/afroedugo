import React, { useState, useEffect } from 'react'
import WelcomeScreen from './screens/WelcomeScreen'
import MainMenu from './screens/MainMenu'
import SchoolFinder from './screens/SchoolFinder'
import HousingFinder from './screens/HousingFinder'
import CommunityScreen from './screens/CommunityScreen'
import ServicesScreen from './screens/ServicesScreen'
import AddListing from './screens/AddListing'
import AuthScreen from './screens/AuthScreen'
import ProfileScreen from './screens/ProfileScreen'
import AdminDashboard from './screens/AdminDashboard'
import ViralJoinModal from './components/ViralJoinModal'
import ChatScreen from './screens/ChatScreen'
import ChatDrawer from './components/ChatDrawer'
import { useAuth } from './hooks/useAuth'

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome')
  const { user, loading: authLoading, syncUserProfile } = useAuth();
  const [hasRecoveredSession, setHasRecoveredSession] = useState(false);
  const [showViralModal, setShowViralModal] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);

  // Handle TikTok Callback & Auth Success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tiktokCode = params.get('code');

    if (tiktokCode) {
      console.log("TikTok Auth Code received:", tiktokCode);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Auto-recovery of session: if user is logged in, skip welcome screen
  useEffect(() => {
    if (!authLoading && user && currentScreen === 'welcome' && !hasRecoveredSession) {
      setCurrentScreen('menu');
      setHasRecoveredSession(true);
    }
  }, [user, authLoading, currentScreen, hasRecoveredSession]);

  const handleAuthSuccess = () => {
    setCurrentScreen('menu');
    setShowViralModal(true);
  };

  const handleOpenChat = (convId) => {
    setActiveConversationId(convId);
  };

  const renderScreen = () => {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onStart={() => setCurrentScreen('menu')} />
      case 'menu':
        return <MainMenu onNavigate={setCurrentScreen} />
      case 'auth':
        return <AuthScreen 
          onBack={() => setCurrentScreen('menu')} 
          onAuthSuccess={handleAuthSuccess} 
        />
      case 'profile':
        if (!user) {
          setCurrentScreen('auth');
          return null;
        }
        return <ProfileScreen 
          onBack={() => setCurrentScreen('menu')} 
          onLogout={() => setCurrentScreen('menu')} 
          onShowViralModal={() => setShowViralModal(true)}
        />
      case 'chat':
        if (!user) {
          setCurrentScreen('auth');
          return null;
        }
        return <ChatScreen 
          onBack={() => setCurrentScreen('menu')} 
          onOpenChat={handleOpenChat}
        />
      case 'schools':
        return <SchoolFinder onBack={() => setCurrentScreen('menu')} />
      case 'housing':
        return <HousingFinder 
          onBack={() => setCurrentScreen('menu')} 
          onNavigate={setCurrentScreen} 
          onOpenChat={handleOpenChat}
        />
      case 'add-listing':
        return <AddListing onBack={() => setCurrentScreen('housing')} />
      case 'community':
        return <CommunityScreen onBack={() => setCurrentScreen('menu')} />
      case 'services':
        return <ServicesScreen onBack={() => setCurrentScreen('menu')} />
      case 'admin':
        return <AdminDashboard onBack={() => setCurrentScreen('profile')} />
      default:
        return <WelcomeScreen onStart={() => setCurrentScreen('menu')} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-pink-100">
      {renderScreen()}
      
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

      {/* Bottom Profile Anchor (Visible on Menu) */}
      {currentScreen === 'menu' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
          <button 
            onClick={() => setCurrentScreen(user ? 'chat' : 'auth')}
            className="bg-white/80 backdrop-blur-md w-14 h-14 rounded-full shadow-lg border border-gray-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            <span className="text-xl">💬</span>
          </button>
          
          <button 
            onClick={() => setCurrentScreen(user ? 'profile' : 'auth')}
            className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-gray-100 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
          >
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} className="w-full h-full object-cover" />
              ) : (
                user?.email ? user.email[0].toUpperCase() : '?'
              )}
            </div>
            <span className="font-black text-xs uppercase tracking-widest text-gray-700">
              {user ? 'My Profile' : 'Login / Join'}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

export default App
