import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';

const formatConvTime = (timestamp) => {
  if (!timestamp) return 'Now';
  const date = timestamp.toDate ? timestamp.toDate() : (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp));
  if (isNaN(date.getTime())) return 'Now';
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - msgDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

const ChatScreen = ({ onBack, onOpenChat }) => {
  const { user } = useAuth();
  const { conversations, loading, deleteConversation } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Auto-open specific chat if convId query param is present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const targetConvId = searchParams.get('convId') || searchParams.get('id');
      if (targetConvId && onOpenChat) {
        onOpenChat(targetConvId);
        // Clean query parameter from URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, [onOpenChat]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;
    const term = searchTerm.toLowerCase();
    return conversations.filter(c => 
      c.participantName?.toLowerCase().includes(term) ||
      c.lastMessage?.toLowerCase().includes(term)
    );
  }, [conversations, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111b21] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#111b21] flex flex-col">
      <header className="p-4 bg-primary dark:bg-[#15221E] text-white sticky top-0 z-20 shadow-md transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-2xl hover:text-gray-200 transition-colors p-1" aria-label="Go Back">←</button>
            <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchTerm('');
              }} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title={isSearchOpen ? "Close Search" : "Search Chats"}
            >
              {isSearchOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Search Input */}
        {isSearchOpen && (
          <div className="mt-3 relative animate-in fade-in slide-in-from-top-2 duration-200">
            <input 
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations by name or message..."
              className="w-full bg-white/10 dark:bg-black/20 text-white placeholder-white/60 text-sm px-4 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-xs"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </header>

      <div className="flex-grow flex flex-col">
        {conversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 sm:p-12 space-y-4 my-auto">
            <div className="w-24 h-24 bg-gray-100 dark:bg-[#1e2a30] rounded-full flex items-center justify-center text-4xl shadow-inner">💬</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">No chats yet</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs text-sm">
              Start chatting with fellow African students, housing providers, or study groups!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link 
                href="/community" 
                className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all"
              >
                Explore Community
              </Link>
              <Link 
                href="/housing" 
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Find Housing
              </Link>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-3 my-auto">
            <span className="text-3xl">🔍</span>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">No chats match "{searchTerm}"</h3>
            <button 
              onClick={() => setSearchTerm('')} 
              className="text-xs text-primary font-bold hover:underline"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const hasUnread = conv.unreadBy?.includes(user?.uid);
            return (
              <div 
                key={conv.id}
                className="relative group w-full bg-white dark:bg-[#111b21] hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors flex items-center justify-between border-b border-gray-100 dark:border-gray-800/60"
              >
                <button
                  onClick={() => onOpenChat(conv.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3.5 w-full">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 font-black overflow-hidden shadow-xs">
                        {conv.participantAvatar && conv.participantAvatar.startsWith('http') ? (
                          <img src={conv.participantAvatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          conv.participantAvatar || '👤'
                        )}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-[#111b21] rounded-full ${conv.participantStatus === 'online' ? 'bg-[#25D366]' : 'bg-gray-400 dark:bg-gray-600'}`}></span>
                    </div>
                    <div className="flex flex-col flex-grow min-w-0 pr-6 sm:pr-8">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-base leading-none truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-800 dark:text-[#e9edef]'}`}>
                          {conv.participantName || 'Fellow Student'}
                        </h4>
                        <span className={`text-[11px] font-medium flex-shrink-0 ml-2 ${hasUnread ? 'text-primary font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                          {formatConvTime(conv.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm line-clamp-1 flex-grow pr-2 ${hasUnread ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-[#8696a0]'}`}>
                          {conv.lastMessage || 'Start the conversation...'}
                        </p>
                        {hasUnread && (
                          <div className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/30">
                            1
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-all z-10"
                  title="Delete Chat"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatScreen;
