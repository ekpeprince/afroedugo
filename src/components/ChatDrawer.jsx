import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';

const ChatDrawer = ({ isOpen, onClose, conversationId }) => {
  const { user } = useAuth();
  const { messages, sendMessage } = useChat(conversationId);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  if (!isOpen || !conversationId) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    await sendMessage(conversationId, inputText);
    setInputText('');
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col bg-white transition-transform duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Chat Header */}
      <header className="p-6 bg-white border-b border-gray-100 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={onClose} className="text-2xl hover:text-primary transition-colors">←</button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black shadow-lg">👤</div>
          <div>
            <h4 className="font-black text-gray-900 leading-none">Baltic Scout</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50/50">
        {messages.length === 0 ? (
          <div className="py-20 text-center text-gray-400 font-medium">
            No messages yet. Break the ice! 🧊
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] p-4 rounded-[1.5rem] shadow-sm text-sm font-bold ${
                  msg.senderId === user.uid 
                    ? 'bg-primary text-white rounded-br-none' 
                    : 'bg-white text-gray-900 rounded-bl-none border border-gray-100'
                }`}
              >
                {msg.text}
                <div className={`text-[9px] mt-1 opacity-60 ${msg.senderId === user.uid ? 'text-right' : 'text-left'}`}>
                  {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSend}
        className="p-6 bg-white border-t border-gray-100 flex items-center gap-4 sticky bottom-0"
      >
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Write your message..."
          className="flex-grow bg-gray-50 py-4 px-6 rounded-[2rem] border border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-700"
        />
        <button 
          type="submit"
          className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatDrawer;
