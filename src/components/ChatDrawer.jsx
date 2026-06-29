import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { storage } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const ChatDrawer = ({ isOpen, onClose, conversationId }) => {
  const { user } = useAuth();
  const { messages, sendMessage, conversations } = useChat(conversationId);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentConv = conversations?.find(c => c.id === conversationId);
  const participantName = currentConv?.participantName || 'Fellow Student';
  const participantAvatar = currentConv?.participantAvatar || '👤';

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  if (!isOpen || !conversationId) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !isUploading) return;
    
    await sendMessage(conversationId, inputText);
    setInputText('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const storageRef = ref(storage, `chats/${conversationId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        null,
        (error) => {
          console.error("Upload failed:", error);
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await sendMessage(conversationId, '', downloadURL);
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error("Error initiating upload:", error);
      setIsUploading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col bg-white transition-transform duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Chat Header */}
      <header className="p-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 sticky top-0 z-20 transition-colors duration-300">
        <button onClick={onClose} className="text-2xl hover:text-primary dark:text-gray-300 transition-colors">←</button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 font-black shadow-inner overflow-hidden border border-gray-200 dark:border-gray-700">
            {participantAvatar.startsWith('http') ? (
              <img src={participantAvatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              participantAvatar
            )}
          </div>
          <div>
            <h4 className="font-black text-gray-900 dark:text-white leading-none">{participantName}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
      </header>

      {/* Safety Warning Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800/50 p-3 flex items-start gap-3 shadow-sm z-10 transition-colors duration-300">
        <span className="text-amber-500 text-lg">⚠️</span>
        <p className="text-xs font-medium text-amber-800 dark:text-amber-200 leading-tight">
          <strong>Safety Warning:</strong> Never transfer money or pay a deposit before viewing a property in person and verifying the landlord's identity.
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-gray-800 transition-colors duration-300">
        {messages.length === 0 ? (
          <div className="py-20 text-center text-gray-400 dark:text-gray-500 font-medium">
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
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-600'
                }`}
              >
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Chat attachment" className="rounded-xl mb-2 max-w-full h-auto" />
                )}
                {msg.text && <p>{msg.text}</p>}
                <div className={`flex items-center gap-1 text-[9px] mt-1 opacity-60 ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                  {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                  {msg.senderId === user.uid && (
                    <span className="ml-1 font-black tracking-tighter">
                      {msg.read ? '✓✓' : '✓'}
                    </span>
                  )}
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
        className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 sticky bottom-0 transition-colors duration-300"
      >
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          disabled={isUploading}
        >
          {isUploading ? '⌛' : '📷'}
        </button>
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Write your message..."
          className="flex-grow bg-gray-50 dark:bg-gray-800 py-4 px-6 rounded-[2rem] border border-transparent focus:border-primary/20 dark:focus:border-primary/40 focus:bg-white dark:focus:bg-gray-900 outline-none transition-all font-bold text-gray-700 dark:text-gray-200"
        />
        <button 
          type="submit"
          disabled={isUploading || (!inputText.trim() && !isUploading)}
          className="w-14 h-14 flex-shrink-0 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
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
