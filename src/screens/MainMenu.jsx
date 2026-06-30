import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useNotifications } from '../hooks/useNotifications'
import { useTheme } from '../context/ThemeContext'
import WelcomeModal from '../components/WelcomeModal'
import { getWhatsAppLink } from '../utils/whatsapp'
import { useGlobalState } from '../context/GlobalStateContext'

const MainMenu = ({ onNavigate }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { deferredPrompt, installPWA } = useGlobalState();
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (deferredPrompt) {
      setShowInstallBanner(true);
    } else {
      setShowInstallBanner(false);
    }
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    await installPWA();
    setShowInstallBanner(false);
  };

  useEffect(() => {
    if (user) {
      const welcomeSeen = localStorage.getItem(`welcome_seen_${user.uid}`);
      if (!welcomeSeen) {
        setShowWelcome(true);
        localStorage.setItem(`welcome_seen_${user.uid}`, 'true');
      }
    }
  }, [user]);

  const menuItems = [
    {
      id: 'schools',
      label: 'Find School',
      sub: 'Affordable universities',
      color: 'bg-primary',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      )
    },
    {
      id: 'housing',
      label: 'Find Housing',
      sub: 'Verified rooms & apartments',
      color: 'bg-secondary',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      id: 'community',
      label: 'Community',
      sub: 'Connect with students',
      color: 'bg-indigo-900',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'services',
      label: 'Student Services',
      sub: 'Visa, bank & arrival help',
      color: 'bg-emerald-900',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-transparent dark:bg-gray-900 transition-colors duration-300 p-6 pb-32 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between py-6 mb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white leading-none transition-colors duration-300">AfroEduGo</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1">Global Student Hub</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200 dark:shadow-none border border-gray-50 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-200 hover:text-secondary transition-all"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsTrayOpen(!isTrayOpen)}
                className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200 dark:shadow-none border border-gray-50 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-200 hover:text-secondary transition-all"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isTrayOpen && (
                <div className="absolute top-14 right-0 w-80 bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700 z-50 p-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Alerts</h4>
                    <button onClick={markAllAsRead} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Mark all read</button>
                  </div>
                  <div className="space-y-4 max-h-96 overflow-y-auto no-scrollbar">
                    {notifications.length === 0 ? (
                      <p className="text-center py-10 text-gray-400 font-bold text-xs">No updates yet. Check back later! ✌️</p>
                    ) : notifications.map(n => (
                      <button
                        key={n.id}
                        onClick={() => { markAsRead(n.id); if (n.link) onNavigate(n.link); setIsTrayOpen(false); }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${n.read ? 'bg-gray-50 dark:bg-gray-900 border-transparent opacity-60' : 'bg-white dark:bg-gray-800 border-primary/10 shadow-md ring-1 ring-primary/5'}`}
                      >
                        <h5 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{n.title}</h5>
                        <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed font-medium">{n.message}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => onNavigate(user ? 'profile' : 'auth')}
            className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200 dark:shadow-none border border-gray-50 dark:border-gray-700 flex items-center justify-center text-primary group hover:scale-110 active:scale-95 transition-all overflow-hidden"
          >
            {user ? (
              user.photoURL ? (
                <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <span className="font-black text-lg">{user.email[0].toUpperCase()}</span>
              )
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="mx-6 mt-4 bg-gradient-to-r from-primary to-indigo-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-xl">📱</div>
            <div>
              <h4 className="font-black text-sm leading-tight">Install AfroEduGo</h4>
              <p className="text-[10px] font-bold text-white/80">Get the app on your home screen</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="px-3 py-2 text-xs font-bold text-white/80 hover:text-white transition-colors"
            >
              Later
            </button>
            <button 
              onClick={handleInstallClick}
              className="bg-white text-primary px-4 py-2 rounded-xl text-xs font-black shadow-md active:scale-95 transition-transform"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* Hero Greeting */}
      <div className="mb-10 mt-6 mx-6">
        <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-[1.1] mb-2 transition-colors duration-300">
          {user ? `Hello, ${profile?.displayName || user.email.split('@')[0]}!` : "Your Future Starts Here."}
        </h2>
        <p className="text-gray-400 font-bold text-sm">
          {user ? "Ready to continue your global search?" : "The easiest way to study and live abroad."}
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-5 mb-10">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col items-start bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-xl shadow-gray-100 dark:shadow-none border border-gray-50 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98] group"
          >
            <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-gray-200 dark:shadow-none group-hover:rotate-12 transition-transform`}>
              {item.icon}
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 leading-tight">{item.label}</h3>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{item.sub}</p>
          </button>
        ))}
      </div>

      {/* Promo Banner */}
      <div className="mt-auto bg-gray-900 rounded-[2.5rem] p-8 relative overflow-hidden group">
        <div className="relative z-10">
          <h4 className="text-white text-xl font-black mb-2 leading-none">Need Visa Help?</h4>
          <p className="text-gray-400 text-xs font-bold leading-relaxed mb-6">Our experts are waiting to help you.</p>
          <a
            href={getWhatsAppLink('', 'Hi, I need expert help with Visa and Student Services.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Talk to Expert
          </a>
        </div>
        <div className="absolute -right-4 -bottom-4 text-[120px] opacity-10 group-hover:scale-110 transition-transform duration-700">🌍</div>
      </div>

      {/* Viral Welcome Trigger */}
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
    </div>
  )
}

export default MainMenu

