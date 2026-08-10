import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';

const ChatScreen = ({ onBack, onOpenChat }) => {
  const { user } = useAuth();
  const { conversations, loading, deleteConversation } = useChat();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#111b21] flex flex-col">
      <header className="p-4 bg-[#008069] dark:bg-[#202c33] text-white flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-2xl hover:text-gray-200 transition-colors">←</button>
          <h1 className="text-xl font-semibold tracking-tight">WhatsApp</h1>
        </div>
        <div className="flex items-center gap-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle>
          </svg>
        </div>
      </header>

      <div className="flex-grow flex flex-col">
        {conversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No chats</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs">Start a chat with a housing provider or a fellow student.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div 
              key={conv.id}
              className="relative group w-full bg-white dark:bg-[#111b21] hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors flex items-center justify-between"
            >
              <button
                onClick={() => onOpenChat(conv.id)}
                className="w-full pl-4 pr-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 font-black overflow-hidden">
                      {conv.participantAvatar && conv.participantAvatar.startsWith('http') ? (
                        <img src={conv.participantAvatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        conv.participantAvatar || '👤'
                      )}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-[#111b21] rounded-full ${conv.participantStatus === 'online' ? 'bg-[#25D366]' : 'bg-gray-400 dark:bg-gray-600'}`}></span>
                  </div>
                  <div className="flex flex-col flex-grow border-b border-gray-100 dark:border-gray-800 pb-4 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-[#e9edef] text-base leading-none">
                        {conv.participantName || 'Fellow Student'}
                      </h4>
                      <span className={`text-xs font-medium ${conv.unreadBy?.includes(user.uid) ? 'text-[#25D366]' : 'text-gray-500 dark:text-gray-400'}`}>
                        {conv.updatedAt?.toDate ? conv.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-500 dark:text-[#8696a0] text-sm line-clamp-1 flex-grow pr-4">
                        {conv.lastMessage || 'Start the conversation...'}
                      </p>
                      {conv.unreadBy?.includes(user.uid) && (
                        <div className="w-5 h-5 bg-[#25D366] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
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
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Delete Chat"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatScreen;
