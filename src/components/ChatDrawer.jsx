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

const SwipeableMessage = ({ onReply, children }) => {
  const [offsetX, setOffsetX] = useState(0);
  const startXRef = useRef(null);
  const isDraggingRef = useRef(false);

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX || (e.touches && e.touches[0].clientX);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || startXRef.current === null) return;
    const currentX = e.clientX || (e.touches && e.touches[0].clientX);
    const diff = currentX - startXRef.current;
    
    // Only allow swipe right for reply (positive X)
    if (diff > 0 && diff < 80) {
      setOffsetX(diff);
    } else if (diff >= 80) {
      setOffsetX(80);
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (offsetX > 50) {
      onReply();
    }
    setOffsetX(0); // Snap back smoothly
  };

  return (
    <div 
      className="relative w-full flex items-center"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      onTouchCancel={handlePointerUp}
    >
      {/* Reply Icon Background */}
      <div 
        className="absolute left-2 flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 transition-opacity z-0"
        style={{ opacity: offsetX / 80, transform: `scale(${Math.min(1, offsetX / 50)})` }}
      >
        <span className="text-gray-600 dark:text-gray-300 transform -scale-x-100 text-sm">↩️</span>
      </div>
      
      {/* The actual message bubble */}
      <div 
        className="w-full z-10"
        style={{ 
          transform: `translateX(${offsetX}px)`, 
          transition: isDraggingRef.current ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
        }}
      >
        {children}
      </div>
    </div>
  );
};

const ChatDrawer = ({ isOpen, onClose, conversationId }) => {
  const { user } = useAuth();

  // Keep a stable conversation ID so the Firestore subscription and
  // messages state are NOT destroyed when the drawer closes (null conversationId).
  // This prevents the "messages disappear on reopen" bug.
  const stableConvId = useRef(conversationId);
  if (conversationId) stableConvId.current = conversationId;

  const { messages, sendMessage, editMessage, deleteMessage, setTypingStatus, conversations } = useChat(stableConvId.current);
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewAudioBlob, setPreviewAudioBlob] = useState(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState(null);

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
    
    if (editingMessageId) {
      await editMessage(stableConvId.current, editingMessageId, inputText);
      setEditingMessageId(null);
    } else {
      await sendMessage(stableConvId.current, inputText.trim(), null, null, replyingTo);
      setInputText('');
      setReplyingTo(null);
      scrollToBottom();
      setTypingStatus(stableConvId.current, false);
    }
  };

  const handleEditClick = (msg) => {
    if (!msg.text) return; // Can only edit text messages
    setEditingMessageId(msg.id);
    setInputText(msg.text);
    // Focus the input
    setTimeout(() => {
      document.getElementById('chat-input-field')?.focus();
    }, 100);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setInputText('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(250); // Get data every 250ms
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start Audio Visualization
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
          analyserRef.current.fftSize = 64; // Small size for simple bars
          
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const drawWave = () => {
            if (!canvasRef.current || !analyserRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (canvas.width !== canvas.offsetWidth * 2) {
              canvas.width = canvas.offsetWidth * 2;
              canvas.height = canvas.offsetHeight * 2;
              ctx.scale(2, 2); // HiDPI
            }
            
            analyserRef.current.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
            
            const barWidth = 3;
            const gap = 2;
            const height = canvas.offsetHeight;
            const totalBars = Math.min(Math.floor(canvas.offsetWidth / (barWidth + gap)), bufferLength);
            const step = Math.max(1, Math.floor(bufferLength / totalBars));
            
            for (let i = 0; i < totalBars; i++) {
              const value = dataArray[i * step]; 
              // Convert 0-255 to a height (min 2px)
              const barHeight = Math.max(3, (value / 255) * height * 0.8);
              const x = i * (barWidth + gap);
              const y = (height - barHeight) / 2;
              
              ctx.fillStyle = '#00a884'; 
              
              // Draw rounded rect
              if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, 2);
                ctx.fill();
              } else {
                ctx.fillRect(x, y, barWidth, barHeight);
              }
            }
            
            animationFrameRef.current = requestAnimationFrame(drawWave);
          };
          
          drawWave();
        }
      } catch (e) {
        console.warn("Audio visualization not supported", e);
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const cleanupAudioNodes = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    // Override onstop so it doesn't upload
    mediaRecorderRef.current.onstop = () => {
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingTime(0);
    cleanupAudioNodes();
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    clearInterval(recordingTimerRef.current);
    cleanupAudioNodes();
    
    mediaRecorderRef.current.onstop = async () => {
      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop()); // release mic
      
      if (audioBlob.size > 0 && user) {
        const url = URL.createObjectURL(audioBlob);
        setPreviewAudioBlob(audioBlob);
        setPreviewAudioUrl(url);
      } else {
        alert("Recording failed: no audio data was captured. Please check your microphone permissions.");
      }
    };
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingTime(0);
  };

  const sendPreviewAudio = async () => {
    if (!previewAudioBlob) return;
    setIsUploading(true);
    try {
      const mimeType = previewAudioBlob.type;
      const ext = mimeType === 'audio/webm' ? 'webm' : 'mp4';
      const storageRef = ref(storage, `chat_audio/${stableConvId.current}/${user.uid}_${Date.now()}_audio.${ext}`);
      const uploadTask = uploadBytesResumable(storageRef, previewAudioBlob);
      uploadTask.on(
        'state_changed', null,
        (error) => {
          console.error("Audio upload failed:", error);
          alert("Audio upload failed: " + error.message);
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await sendMessage(stableConvId.current, '', null, downloadURL, replyingTo);
          setIsUploading(false);
          setPreviewAudioBlob(null);
          setPreviewAudioUrl(null);
          setReplyingTo(null);
        }
      );
    } catch (err) {
      console.error("Audio upload error:", err);
      alert("Upload error: " + err.message);
      setIsUploading(false);
    }
  };

  const cancelPreview = () => {
    setPreviewAudioBlob(null);
    setPreviewAudioUrl(null);
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
                <div id={`msg-${msg.id}`} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'} group relative overflow-hidden`}>
                  
                  {msg.senderId === user.uid && (
                    <div className="opacity-0 group-hover:opacity-100 absolute -left-16 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity z-10 hidden sm:flex">
                      {msg.text && (
                        <button 
                          onClick={() => handleEditClick(msg)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Edit message"
                        >
                          ✏️
                        </button>
                      )}
                      <button 
                        onClick={() => { if(window.confirm('Delete this message?')) deleteMessage(stableConvId.current, msg.id) }}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete message"
                      >
                        🗑️
                      </button>
                    </div>
                  )}

                  <SwipeableMessage onReply={() => setReplyingTo(msg)}>
                    <div 
                      className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-[1.5rem] shadow-sm text-sm font-bold ${
                        msg.senderId === user.uid 
                          ? 'bg-primary text-white rounded-br-none ml-auto' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-600'
                      }`}
                    >
                      {msg.replyToMessageId && (
                        <div 
                          className={`rounded-lg p-2 mb-2 border-l-4 text-xs overflow-hidden cursor-pointer ${
                            msg.senderId === user.uid ? 'bg-black/20 border-white/50 text-white/90' : 'bg-gray-100 dark:bg-gray-800 border-primary/50 text-gray-600 dark:text-gray-300'
                          }`}
                          onClick={() => {
                            const el = document.getElementById(`msg-${msg.replyToMessageId}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                        >
                          <div className={`font-black mb-1 ${msg.senderId === user.uid ? 'text-white' : 'text-primary'}`}>
                            {msg.replyToSenderId === user.uid ? 'You' : participantName}
                          </div>
                          <div className="truncate opacity-90">{msg.replyToText}</div>
                        </div>
                      )}
                      {msg.imageUrl && (
                        <img 
                          src={msg.imageUrl} 
                          alt="Chat attachment" 
                          className="rounded-xl mb-2 max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => setFullScreenImage(msg.imageUrl)}
                        />
                      )}
                      {msg.audioUrl && (
                        <div className="mb-2 w-48 sm:w-64">
                          <audio controls src={msg.audioUrl} className="w-full h-10" />
                        </div>
                      )}
                      {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                      <div className={`flex items-center gap-1 text-[9px] mt-1 opacity-60 ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                        {msg.isEdited && <span className="mr-1 italic">(edited)</span>}
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        {msg.senderId === user.uid && (
                          <span className="ml-1 font-black tracking-tighter">
                            {msg.read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </SwipeableMessage>
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
      <div className="p-2 sm:p-4 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')] bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 transition-colors duration-300">
        {replyingTo && !editingMessageId && (
          <div className="flex items-center justify-between mb-2 px-4 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl text-sm border-l-4 border-primary shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col overflow-hidden">
              <span className="text-primary font-black text-xs mb-1">Replying to {replyingTo.senderId === user.uid ? 'yourself' : participantName}</span>
              <span className="text-gray-600 dark:text-gray-300 truncate font-medium">
                {replyingTo.text || (replyingTo.audioUrl ? '🎤 Voice Message' : (replyingTo.imageUrl ? '📷 Image' : 'Message'))}
              </span>
            </div>
            <button onClick={cancelReply} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-4 p-2 rounded-full transition-colors flex-shrink-0">✕</button>
          </div>
        )}
        {editingMessageId && (
          <div className="flex items-center justify-between mb-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 animate-in fade-in slide-in-from-bottom-2">
            <span>✏️ Editing message...</span>
            <button onClick={cancelEdit} className="text-red-500 hover:text-red-600 font-bold">Cancel</button>
          </div>
        )}
        <form 
          onSubmit={handleSend}
          className="flex items-end gap-2 max-w-4xl mx-auto"
        >
          {previewAudioUrl ? (
            <div className="flex-grow flex items-center justify-between bg-white dark:bg-gray-800 h-12 px-2 rounded-full shadow-sm animate-in fade-in slide-in-from-right-4 transition-all gap-2">
              <button
                type="button"
                onClick={cancelPreview}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-full transition-colors flex items-center justify-center flex-shrink-0"
                title="Discard Voice Note"
                disabled={isUploading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>

              <audio controls src={previewAudioUrl} className="h-8 w-full max-w-[200px]" />
            </div>
          ) : isRecording ? (
            <div className="flex-grow flex items-center justify-between bg-white dark:bg-gray-800 h-12 px-4 rounded-full shadow-sm animate-in fade-in slide-in-from-right-4 transition-all">
              <button
                type="button"
                onClick={cancelRecording}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 -ml-2 rounded-full transition-colors flex items-center justify-center"
                title="Discard Voice Note"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50"></div>
                <span className="text-gray-800 dark:text-gray-200 font-medium font-mono text-base tracking-wide min-w-[45px]">
                  {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              
              <canvas ref={canvasRef} className="flex-grow h-8 mx-2 hidden sm:block opacity-80" />
              
              <div className="text-gray-400 text-sm italic pr-2 hidden sm:block flex-shrink-0">
                Slide to cancel &lt;
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-end bg-white dark:bg-gray-800 rounded-[1.5rem] shadow-sm min-h-[48px] px-2 py-1 transition-all">
              {!editingMessageId && (
                <>
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
                    className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                    disabled={isUploading}
                    title="Attach Image"
                  >
                    {isUploading ? (
                      <span className="w-6 h-6 flex items-center justify-center animate-spin">⏳</span>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                      </svg>
                    )}
                  </button>
                </>
              )}
              
              <textarea 
                id="chat-input-field"
                value={inputText}
                onChange={handleInputChange}
                placeholder={editingMessageId ? "Edit message..." : "Message"}
                className="flex-grow bg-transparent py-2.5 px-2 max-h-32 outline-none text-gray-800 dark:text-gray-200 resize-none overflow-y-auto"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputText.trim() || editingMessageId) {
                      handleSend(e);
                    }
                  }
                }}
              />
            </div>
          )}

          {previewAudioUrl ? (
            <button 
              type="button"
              onClick={sendPreviewAudio}
              disabled={isUploading}
              className="w-12 h-12 flex-shrink-0 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full flex items-center justify-center shadow-md transition-all scale-100 disabled:opacity-50"
            >
              {isUploading ? (
                <span className="animate-spin text-xl">⏳</span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          ) : isRecording ? (
            <button 
              type="button"
              onClick={stopRecording}
              className="w-12 h-12 flex-shrink-0 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full flex items-center justify-center shadow-md transition-all scale-100"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" ry="2"/>
              </svg>
            </button>
          ) : (
            inputText.trim() || editingMessageId ? (
              <button 
                type="submit"
                disabled={isUploading}
                className="w-12 h-12 flex-shrink-0 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full flex items-center justify-center shadow-md transition-all scale-100 disabled:opacity-50"
              >
                {editingMessageId ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                )}
              </button>
            ) : (
              <button 
                type="button"
                onClick={startRecording}
                disabled={isUploading}
                className="w-12 h-12 flex-shrink-0 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full flex items-center justify-center shadow-md transition-all scale-100 disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                </svg>
              </button>
            )
          )}
        </form>
      </div>

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
