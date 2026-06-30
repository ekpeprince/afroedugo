import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';

const ChatScreen = ({ onBack, onOpenChat }) => {
  const { user } = useAuth();
  const { conversations, loading } = useChat();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="p-8 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-2xl hover:text-primary transition-colors">←</button>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Messages</h1>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black shadow-inner">
          {conversations.length}
        </div>
      </header>

      <div className="flex-grow p-6 space-y-4">
        {conversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="w-24 h-24 bg-gray-100 rounded-[2.5rem] flex items-center justify-center text-4xl">💬</div>
            <h3 className="text-xl font-black text-gray-900">No conversations yet</h3>
            <p className="text-gray-400 font-medium max-w-xs">Start a chat with a housing provider or a fellow student to see it here.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button 
              key={conv.id}
              onClick={() => onOpenChat(conv.id)}
              className="w-full bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200 border border-gray-100 flex items-center justify-between hover:scale-[1.02] active:scale-95 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 font-black shadow-lg overflow-hidden border border-gray-200">
                  {conv.participantAvatar && conv.participantAvatar.startsWith('http') ? (
                    <img src={conv.participantAvatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    conv.participantAvatar || '👤'
                  )}
                </div>
                <div className="text-left">
                  <h4 className="font-black text-gray-900 text-lg leading-none mb-1">
                    {conv.participantName || 'Fellow Student'}
                  </h4>
                  <p className="text-gray-400 text-sm font-medium line-clamp-1">
                    {conv.lastMessage || 'Start the conversation...'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                  {conv.updatedAt?.toDate ? conv.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                </span>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatScreen;
