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
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-2xl z-20 px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-2xl hover:text-primary transition-colors text-gray-900">←</button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight leading-none text-gray-900 mb-1">Community Hub</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Student Forum</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-xs shadow-inner">
          {user ? user.email[0].toUpperCase() : '👤'}
        </div>
      </header>

      <div className="flex-grow pt-24 px-4 sm:px-6 pb-24 max-w-3xl mx-auto w-full">
        {/* Create Post Section */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-black text-sm shrink-0 border border-gray-200">
                {user ? user.email[0].toUpperCase() : '👤'}
              </div>
              <textarea 
                placeholder="What's on your mind? Ask a question or share a tip..."
                className="flex-grow bg-transparent pt-3 pb-2 outline-none font-medium text-gray-900 placeholder:text-gray-400 resize-none min-h-[60px]"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isSending}
              />
            </div>
            
            {imagePreview && (
              <div className="mb-2 relative inline-block ml-16">
                <img src={imagePreview} className="w-32 h-32 object-cover rounded-2xl shadow-md border border-gray-100" />
                <button 
                  type="button"
                  onClick={() => {setAttachedImage(null); setImagePreview(null);}}
                  className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >✕</button>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-50 ml-16">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-xs"
              >
                <span className="text-xl">📷</span> Photo
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
              <button 
                type="submit"
                disabled={isSending || (!newMessage.trim() && !attachedImage) || !user}
                className="bg-primary text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isSending ? 'Posting...' : 'Post'}
              </button>
            </div>
            {!user && (
               <div className="text-center mt-2">
                 <button type="button" onClick={onLogin} className="text-primary font-bold text-xs hover:underline">Log in to join the conversation</button>
               </div>
            )}
          </form>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 pb-2">
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all font-black text-xs uppercase tracking-widest ${
                selectedCategory === cat.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
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
            className="w-full bg-white py-4 pl-12 pr-6 rounded-2xl border border-gray-100 focus:border-primary/40 focus:ring-4 ring-primary/10 outline-none transition-all font-bold text-gray-900 placeholder:text-gray-400 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center py-20 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
              <div className="text-4xl mb-4 opacity-50">📫</div>
              <p className="text-gray-900 font-bold">No discussions yet</p>
              <p className="text-gray-400 text-xs font-bold uppercase mt-1 tracking-widest">Be the first to start a conversation!</p>
            </div>
          ) : (
            filteredDiscussions.map((msg) => {
              const catInfo = categories.find(c => c.id === msg.category) || categories[1];
              return (
                <div key={msg.id} className="group animate-in fade-in duration-500">
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 group-hover:border-primary/20 transition-all">
                    {/* Post Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl border border-gray-100 shadow-sm">👤</div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-gray-900 text-base">{msg.user}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide ${msg.userRole === 'current' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                              {msg.userRole === 'current' ? '🎓 Current' : '✈️ Incoming'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                            <span>{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                            <span>•</span>
                            <span className="text-primary">{catInfo.label}</span>
                          </div>
                        </div>
                      </div>
                      {user && msg.userId !== user.uid && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartPrivateChat(msg.userId, msg.user);
                          }}
                          className="p-2.5 bg-gray-50 rounded-xl text-primary hover:bg-primary hover:text-white transition-all active:scale-90 shadow-sm"
                          title="Message Student"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Post Body */}
                    <p className="text-gray-800 text-[15px] leading-relaxed font-medium mb-4 whitespace-pre-wrap">{msg.text}</p>
                    
                    {msg.imageUrl && (
                      <div className="mb-4 rounded-[1.5rem] overflow-hidden border border-gray-100 shadow-sm">
                        <SmartImage src={msg.imageUrl} className="w-full h-auto max-h-96 object-cover hover:scale-105 transition-transform duration-700" />
                      </div>
                    )}

                    {/* Post Footer (Engagement) */}
                    <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
                      <div className="flex gap-6">
                        <button 
                          onClick={() => handleToggleLike(msg.id, msg.likes)}
                          className={`flex items-center gap-2 text-sm font-black transition-all hover:scale-105 active:scale-95 ${
                            user && msg.likes?.includes(user.uid) 
                              ? 'text-red-500' 
                              : 'text-gray-500 hover:text-red-400'
                          }`}
                        >
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill={user && msg.likes?.includes(user.uid) ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            strokeWidth="2.5"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          <span>{msg.likes?.length || 0}</span>
                        </button>

                        <button 
                          onClick={() => setExpandedPost(expandedPost === msg.id ? null : msg.id)}
                          className={`flex items-center gap-2 text-sm font-black transition-all hover:scale-105 active:scale-95 ${
                            expandedPost === msg.id ? 'text-primary' : 'text-gray-500 hover:text-primary'
                          }`}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          <span>{msg.commentCount || 0}</span>
                        </button>
                      </div>
                      <div className="flex gap-2 hidden sm:flex">
                         {msg.userCountry && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-gray-50 text-gray-500">📍 {msg.userCountry}</span>}
                         {msg.userMajor && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-gray-50 text-gray-500">🎓 {msg.userMajor}</span>}
                      </div>
                    </div>

                    {expandedPost === msg.id && (
                      <div className="mt-4">
                        <CommentSection 
                          postId={msg.id} 
                          postAuthorId={msg.userId}
                          postTitle={msg.text.slice(0, 30) + '...'}
                          onLogin={onLogin}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default CommunityScreen

