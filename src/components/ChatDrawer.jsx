import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { storage, db } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { onSnapshot, doc } from 'firebase/firestore';

const formatMessageDate = (timestamp) => {
  if (!timestamp) return 'Today';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

const ChatDrawer = ({ isOpen, onClose, conversationId }) => {
  const { user } = useAuth();

  // Keep a stable conversation ID so the Firestore subscription and
  // messages state are NOT destroyed when the drawer closes (null conversationId).
  // This prevents the "messages disappear on reopen" bug.
  const stableConvId = useRef(conversationId);
  if (conversationId) stableConvId.current = conversationId;

  const { messages, sendMessage, deleteMessage, setTypingStatus, conversations } = useChat(stableConvId.current);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [participantStatus, setParticipantStatus] = useState('offline');
  const [participantLastOnline, setParticipantLastOnline] = useState(null);

  const currentConv = conversations?.find(c => c.id === conversationId);
  const participantId = currentConv?.participantId;
  const participantName = currentConv?.participantName || 'Fellow Student';
  const participantAvatar = currentConv?.participantAvatar || '👤';
  const isParticipantTyping = currentConv?.typing?.[participantId];

  useEffect(() => {
    const participantId = currentConv?.participantId;
    if (!isOpen || !participantId) return;

    const unsub = onSnapshot(doc(db, 'users', participantId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setParticipantStatus(data.status || 'offline');
        setParticipantLastOnline(data.lastOnline || null);
      }
    });

    return () => unsub();
  }, [isOpen, currentConv?.participantId]);

  const formatLastOnline = (lastOnline) => {
    if (!lastOnline) return '';
    const date = lastOnline.toDate ? lastOnline.toDate() : new Date(lastOnline);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Never had a conversation opened yet — nothing to render
  if (!isOpen && !stableConvId.current) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !isUploading) return;
    
    await sendMessage(stableConvId.current, inputText);
    setInputText('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingStatus(stableConvId.current, false);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    setTypingStatus(stableConvId.current, true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(stableConvId.current, false);
    }, 2000);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const storageRef = ref(storage, `chats/${conversationId}/${user.uid}_${Date.now()}_${file.name}`);
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
          await sendMessage(stableConvId.current, '', downloadURL);
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
            {participantStatus === 'online' ? (
              <p className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </p>
            ) : (
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-650 rounded-full"></span>
                Offline{participantLastOnline ? ` • Active ${formatLastOnline(participantLastOnline)}` : ''}
              </p>
            )}
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
          messages.map((msg, index) => {
            const currentDate = formatMessageDate(msg.createdAt);
            const prevDate = index > 0 ? formatMessageDate(messages[index - 1].createdAt) : null;
            const showDateHeader = currentDate !== prevDate;

            return (
              <React.Fragment key={msg.id}>
                {showDateHeader && (
                  <div className="flex justify-center my-4">
                    <span className="bg-gray-200/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      {currentDate}
                    </span>
                  </div>
                )}
                <div className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'} group relative`}>
                  
                  {msg.senderId === user.uid && (
                    <button 
                      onClick={() => { if(window.confirm('Delete this message?')) deleteMessage(stableConvId.current, msg.id) }}
                      className="opacity-0 group-hover:opacity-100 absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-red-400 hover:text-red-600 transition-opacity"
                      title="Delete message"
                    >
                      🗑️
                    </button>
                  )}

                  <div 
                    className={`max-w-[75%] p-4 rounded-[1.5rem] shadow-sm text-sm font-bold ${
                      msg.senderId === user.uid 
                        ? 'bg-primary text-white rounded-br-none' 
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-600'
                    }`}
                  >
                    {msg.imageUrl && (
                      <img 
                        src={msg.imageUrl} 
                        alt="Chat attachment" 
                        className="rounded-xl mb-2 max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => setFullScreenImage(msg.imageUrl)}
                      />
                    )}
                    {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
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
              </React.Fragment>
            );
          })
        )}
        
        {isParticipantTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-4 py-3 rounded-[1.5rem] rounded-bl-none flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
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
          onChange={handleInputChange}
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

      {/* Full Screen Image Viewer Modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setFullScreenImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black w-12 h-12 rounded-full font-bold flex items-center justify-center transition-colors">✕</button>
          <img src={fullScreenImage} alt="Full screen" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default ChatDrawer;
