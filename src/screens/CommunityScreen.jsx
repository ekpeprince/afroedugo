import React, { useState, useMemo, useRef } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { db, storage } from '../firebase/config'
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useChat } from '../hooks/useChat'
import CommentSection from '../components/CommentSection'
import SmartImage from '../components/SmartImage'

const CommunityScreen = ({ onBack, onOpenChat, onLogin }) => {
  const { user } = useAuth();
  const { getOrCreateConversation } = useChat();
  const { profile } = useProfile();

  // ... existing state ...

  const handleStartPrivateChat = async (userId, userName) => {
    if (!user) {
      alert("Please login to message students!");
      return;
    }
    if (userId === user.uid) {
      alert("You can't message yourself!");
      return;
    }
    const convId = await getOrCreateConversation(userId, { type: 'student-to-student' });
    if (convId) {
      onOpenChat(convId);
    }
  };
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [newMessage, setNewMessage] = useState('')

  const handleToggleLike = async (postId, likes = []) => {
    if (!user) {
      alert("Please login to react to posts!");
      return;
    }
    const isLiked = likes?.includes(user.uid);
    const postRef = doc(db, 'discussions', postId);

    try {
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };
  const [isSending, setIsSending] = useState(false)
  const [expandedPost, setExpandedPost] = useState(null)
  const [attachedImage, setAttachedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const { data: discussions, loading, error } = useFirestore('discussions', 'createdAt');
  
  const categories = [
    { id: 'all', label: 'All', icon: '🌐', color: 'bg-indigo-50', textColor: 'text-indigo-600' },
    { id: 'general', label: 'General', icon: '💬', color: 'bg-blue-50', textColor: 'text-blue-600' },
    { id: 'visa', label: 'Visa Help', icon: '📄', color: 'bg-amber-50', textColor: 'text-amber-600' },
    { id: 'housing', label: 'Housing Tips', icon: '🏠', color: 'bg-emerald-50', textColor: 'text-emerald-600' }
  ]

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachedImage) return;
    if (!user) {
      alert("Please login to post!");
      return;
    }

    setIsSending(true);
    try {
      let imageUrl = '';
      if (attachedImage) {
        const imageRef = ref(storage, `community/${Date.now()}_${attachedImage.name}`);
        const snapshot = await uploadBytes(imageRef, attachedImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const postCategory = selectedCategory === 'all' ? 'general' : selectedCategory;
      await addDoc(collection(db, 'discussions'), {
        text: newMessage,
        category: postCategory,
        createdAt: serverTimestamp(),
        userId: user.uid,
        user: profile?.displayName || user.email.split('@')[0],
        userEmail: user.email,
        userCountry: profile?.country || '',
        userMajor: profile?.major || '',
        userRole: profile?.role || 'incoming',
        likes: [],
        commentCount: 0,
        imageUrl: imageUrl
      });

      setNewMessage('');
      setAttachedImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };
  // ... filteredDiscussions ...
  const filteredDiscussions = useMemo(() => {
    return discussions.filter(d => 
      (selectedCategory === 'all' || d.category === selectedCategory) &&
      ((d.text || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [discussions, selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-black flex flex-col">
      <header className="fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-2xl z-20 px-6 py-4 flex items-center justify-between border-b border-white/5 text-white">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight leading-none mb-1">Community Hub</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Student Forum</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-xs">
          {user ? user.email[0].toUpperCase() : '👤'}
        </div>
      </header>

      <div className="flex-grow pt-24 px-6 pb-48">
        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-8 pb-2">
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all font-black text-xs uppercase tracking-widest ${
                selectedCategory === cat.id 
                  ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' 
                  : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative mb-8">
          <input 
            type="text"
            placeholder="Search discussions..." 
            className="w-full bg-white/5 py-4 pl-12 pr-6 rounded-2xl border border-white/10 focus:border-primary/40 focus:bg-white/10 outline-none transition-all font-bold text-white placeholder:text-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </div>

        <div className="space-y-12">
          {loading ? (
            <div className="flex flex-col items-center py-20 animate-pulse">
              <div className="w-12 h-12 bg-white/10 rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-white/10 rounded"></div>
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[3rem] p-10 border border-white/10 backdrop-blur-xl">
              <div className="text-4xl mb-4 opacity-50">📫</div>
              <p className="text-gray-400 font-bold">No discussions yet</p>
              <p className="text-gray-300 text-xs font-bold uppercase mt-1 tracking-widest">Be the first to start a conversation!</p>
            </div>
          ) : (
            filteredDiscussions.map((msg) => {
              const catInfo = categories.find(c => c.id === msg.category) || categories[1];
              return (
                <div key={msg.id} className="group animate-in fade-in duration-500">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg border border-gray-100">👤</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-sm tracking-tight">{msg.user}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wide ${msg.userRole === 'current' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>
                              {msg.userRole === 'current' ? '🎓 Current' : '✈️ Incoming'}
                            </span>
                            <span className="text-[9px] text-gray-500 font-bold">
                              {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                             <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-gray-300 border border-white/5`}>
                              {catInfo.label}
                            </span>
                            {msg.userCountry && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-secondary/20 text-secondary-300 border border-secondary/20">📍 {msg.userCountry}</span>}
                            {msg.userMajor && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/20 text-primary-300 border border-primary/20">🎓 {msg.userMajor}</span>}
                          </div>
                        </div>
                      </div>
                      {user && msg.userId !== user.uid && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartPrivateChat(msg.userId, msg.user);
                          }}
                          className="p-3 bg-white/5 rounded-2xl text-primary hover:bg-primary hover:text-white transition-all shadow-lg active:scale-90"
                          title="Message Student"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl shadow-black/20 group-hover:border-primary/40 transition-all">
                      <p className="text-white text-base leading-relaxed font-bold mb-4">{msg.text}</p>
                      
                      {msg.imageUrl && (
                        <div className="mb-4 rounded-2xl overflow-hidden border border-gray-50">
                          <SmartImage src={msg.imageUrl} className="w-full h-auto max-h-96 object-cover" />
                        </div>
                      )}

                      <div className="flex items-center gap-6 border-t border-white/10 pt-4">
                        <button 
                          onClick={() => handleToggleLike(msg.id, msg.likes)}
                          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                            user && msg.likes?.includes(user.uid) 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        >
                          <svg 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill={user && msg.likes?.includes(user.uid) ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            strokeWidth="3"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          <span>{msg.likes?.length || 0} Likes</span>
                        </button>

                        <button 
                          onClick={() => setExpandedPost(expandedPost === msg.id ? null : msg.id)}
                          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                            expandedPost === msg.id ? 'text-primary' : 'text-gray-400 hover:text-primary'
                          }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          <span>{msg.commentCount || 0} Replies</span>
                        </button>
                      </div>

                      {expandedPost === msg.id && (
                        <CommentSection 
                          postId={msg.id} 
                          postAuthorId={msg.userId}
                          postTitle={msg.text.slice(0, 30) + '...'}
                          onLogin={onLogin}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-900/60 backdrop-blur-3xl border-t border-white/5 z-30">
        <form onSubmit={handleSendMessage} className="max-w-x2 mx-auto">
          {imagePreview && (
            <div className="mb-4 relative inline-block">
              <img src={imagePreview} className="w-20 h-20 object-cover rounded-2xl shadow-xl border-2 border-primary" />
              <button 
                onClick={() => {setAttachedImage(null); setImagePreview(null);}}
                className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg"
              >✕</button>
            </div>
          )}
          
          <div className="relative flex items-center bg-white/5 rounded-[2.5rem] p-2 border border-white/10 focus-within:ring-4 ring-primary/20 transition-all">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-4 bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
            <input 
              type="text"
              placeholder="What's on your mind?"
              className="flex-grow bg-transparent py-4 px-4 outline-none font-bold text-white placeholder:text-gray-600"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
            />
            <button 
              type="submit"
              disabled={isSending || (!newMessage.trim() && !attachedImage) || !user}
              className="bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
            >
              {isSending ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              )}
            </button>
          </div>
          {!user && (
            <div className="flex justify-center mt-2">
              <button 
                type="button"
                onClick={onLogin}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black text-[10px] uppercase tracking-widest rounded-full shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              >
                Login to Join the Conversation
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default CommunityScreen

