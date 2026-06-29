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
import ProfileModal from '../components/ProfileModal'
import NotificationsDropdown from '../components/NotificationsDropdown'
import PostText from '../components/PostText'
import { useNotifications } from '../hooks/useNotifications'

const CommunityScreen = ({ onBack, onOpenChat, onLogin }) => {
  const { user } = useAuth();
  const { getOrCreateConversation } = useChat();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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

  const handleToggleLike = async (postId, likes = [], postAuthorId, postText) => {
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
      
      if (!isLiked && postAuthorId && postAuthorId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: postAuthorId,
          title: '❤️ New Like!',
          message: `${profile?.displayName || user.email.split('@')[0]} liked your post: "${postText.slice(0, 30)}..."`,
          type: 'like',
          link: 'community',
          read: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const [isSending, setIsSending] = useState(false)
  const [expandedPost, setExpandedPost] = useState(null)
  const [attachedImages, setAttachedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  
  const { data: discussions, loading, error } = useFirestore('discussions', 'createdAt');
  
  const categories = [
    { id: 'all', label: 'All', icon: '🌐', color: 'bg-indigo-50', textColor: 'text-indigo-600' },
    { id: 'general', label: 'General', icon: '💬', color: 'bg-blue-50', textColor: 'text-blue-600' },
    { id: 'visa', label: 'Visa Help', icon: '📄', color: 'bg-amber-50', textColor: 'text-amber-600' },
    { id: 'housing', label: 'Housing Tips', icon: '🏠', color: 'bg-emerald-50', textColor: 'text-emerald-600' }
  ]

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newFiles = [...attachedImages, ...files].slice(0, 4); // Limit to 4
    setAttachedImages(newFiles);
    
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index) => {
    const newFiles = attachedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setAttachedImages(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachedImages.length === 0) return;
    if (!user) {
      alert("Please login to post!");
      return;
    }

    setIsSending(true);
    try {
      let imageUrls = [];
      if (attachedImages.length > 0) {
        for (const file of attachedImages) {
          const imageRef = ref(storage, `community/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(imageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          imageUrls.push(url);
        }
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
        userPhotoURL: profile?.photoURL || null,
        likes: [],
        commentCount: 0,
        imageUrls: imageUrls,
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : ''
      });

      setNewMessage('');
      setAttachedImages([]);
      setImagePreviews([]);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredDiscussions = useMemo(() => {
    return discussions.filter(d => 
      (selectedCategory === 'all' || d.category === selectedCategory) &&
      ((d.text || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [discussions, selectedCategory, searchTerm]);

  const trendingTopics = useMemo(() => {
    if (!discussions) return [];
    
    const counts = {};
    discussions.forEach(d => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    
    return sorted.map(([catId, count]) => {
      const catInfo = categories.find(c => c.id === catId) || categories[1];
      let title = "";
      if (catId === 'general') title = "General discussions across the board";
      if (catId === 'visa') title = "Latest questions and updates on visas";
      if (catId === 'housing') title = "Tips and questions on accommodation";
      return {
        id: catId,
        label: catInfo.label,
        title: title,
        count: count
      };
    });
  }, [discussions]); // Removed 'categories' since it's defined outside

  const activeMembers = useMemo(() => {
    if (!discussions) return [];
    
    const userMap = {};
    discussions.forEach(d => {
      if (!userMap[d.userId]) {
        userMap[d.userId] = {
          name: d.user,
          role: d.userRole,
          country: d.userCountry,
          photoURL: d.userPhotoURL,
          count: 0
        };
      }
      userMap[d.userId].count += 1;
    });
    
    return Object.values(userMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [discussions]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-gray-900 transition-colors duration-300 flex flex-col font-sans">
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 z-30 h-16 flex items-center justify-between px-4 sm:px-8 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-700 dark:text-gray-300">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">AfroEdugo <span className="text-primary font-black">Social</span></h1>
          </div>
        </div>

        <div className="flex-grow max-w-md mx-8 hidden md:block">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search community..." 
              className="w-full bg-gray-100 dark:bg-gray-700 py-2.5 pl-12 pr-4 rounded-full border-none focus:ring-2 ring-primary/30 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-50">
          {user && (
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
              </button>
              <NotificationsDropdown 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
              />
            </div>
          )}
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-600 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
            {profile?.photoURL || user?.photoURL ? (
              <img src={profile?.photoURL || user?.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : user ? (
              user.email[0].toUpperCase()
            ) : (
              '👤'
            )}
          </div>
        </div>
      </header>

      <div className="flex-grow pt-20 px-4 pb-24 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 space-y-6">
            {user ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center transition-colors duration-300">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold border-4 border-white dark:border-gray-800 shadow-md mb-3">
                  {profile?.photoURL || user?.photoURL ? (
                    <img src={profile?.photoURL || user?.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.email[0].toUpperCase()
                  )}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{profile?.displayName || user.email.split('@')[0]}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{profile?.major || 'Undecided Major'}</p>
                <div className="flex items-center gap-2 mt-1 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${profile?.role === 'current' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {profile?.role === 'current' ? '🎓 Current Student' : '✈️ Incoming'}
                  </span>
                </div>
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2 rounded-full font-bold text-sm shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center transition-colors duration-300">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl mb-3">👋</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Join the Community</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Connect with students and share experiences.</p>
                <button onClick={onLogin} className="w-full bg-primary text-white py-2.5 rounded-full font-bold shadow-md hover:bg-primary/90 transition-colors">
                  Log In or Sign Up
                </button>
              </div>
            )}
            <nav className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
              <ul className="flex flex-col py-2">
                <li>
                  <button className="w-full flex items-center gap-4 px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-primary font-bold bg-primary/5 border-l-4 border-primary">
                    <span className="text-xl">🏠</span> Home Feed
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center gap-4 px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-semibold border-l-4 border-transparent">
                    <span className="text-xl">🔖</span> Saved Posts
                  </button>
                </li>
                <li>
                  <button className="w-full flex items-center gap-4 px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-semibold border-l-4 border-transparent">
                    <span className="text-xl">✉️</span> Messages
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="flex-grow max-w-2xl w-full mx-auto">
          <div className="md:hidden mb-4">
             <input 
                type="text"
                placeholder="Search community..." 
                className="w-full bg-white dark:bg-gray-800 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary outline-none transition-all font-medium text-gray-900 dark:text-white text-sm shadow-sm mb-3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all font-bold text-sm ${
                  selectedCategory === cat.id 
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md' 
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 transition-colors duration-300">
            <form onSubmit={handleSendMessage} className="flex flex-col">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold text-sm shrink-0">
                  {profile?.photoURL || user?.photoURL ? (
                    <img src={profile?.photoURL || user?.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : user ? (
                    user.email[0].toUpperCase()
                  ) : (
                    '👤'
                  )}
                </div>
                <div className="flex-grow flex flex-col">
                  <textarea 
                    placeholder="Share something with the community..."
                    className="w-full bg-transparent pt-2 pb-2 outline-none font-medium text-gray-900 dark:text-white text-lg placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none min-h-[50px]"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                  />
                </div>
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="mt-3 mb-2 flex gap-2 overflow-x-auto ml-13 pb-2 no-scrollbar">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative inline-block shrink-0">
                      <img src={preview} className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-sm" />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-gray-900/70 backdrop-blur-sm text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors text-xs"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-primary hover:bg-primary/5 px-3 py-1.5 rounded-full transition-colors font-bold text-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Media
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*" 
                  multiple
                />
                <button 
                  type="submit"
                  disabled={isSending || (!newMessage.trim() && attachedImages.length === 0) || !user}
                  className="bg-primary text-white px-6 py-2 rounded-full font-bold text-sm shadow-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSending ? 'Posting...' : 'Post'}
                </button>
              </div>
              {!user && (
                 <div className="text-center mt-3 text-sm">
                   <button type="button" onClick={onLogin} className="text-primary font-bold hover:underline">Log in to interact</button>
                 </div>
              )}
            </form>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))
            ) : filteredDiscussions.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
                <div className="text-4xl mb-3 opacity-50">📫</div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">No posts yet</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Be the first to share something!</p>
              </div>
            ) : (
              filteredDiscussions.map((msg) => {
                return (
                  <article key={msg.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                    <div className="p-4 sm:p-5 flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-lg shrink-0 cursor-pointer border border-gray-200 dark:border-gray-600">
                          {msg.userPhotoURL ? (
                            <img src={msg.userPhotoURL} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 leading-tight">
                            <span className="font-bold text-gray-900 dark:text-white cursor-pointer hover:underline">{msg.user}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">·</span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm hover:underline cursor-pointer">
                              {msg.createdAt?.toDate ? (() => {
                                const date = msg.createdAt.toDate();
                                const now = new Date();
                                const diffMs = now - date;
                                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                if (diffHrs < 1) return 'Just now';
                                if (diffHrs < 24) return `${diffHrs}h`;
                                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                              })() : 'Just now'}
                            </span>
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 line-clamp-1">
                            {msg.userRole === 'current' ? '🎓 Current Student' : '✈️ Incoming'} 
                            {msg.userCountry ? ` from ${msg.userCountry}` : ''}
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                        </svg>
                      </button>
                    </div>

                    <div className="px-4 sm:px-5 pb-3">
                      <PostText 
                        text={msg.text} 
                        onHashtagClick={(tag) => {
                          setSearchTerm(tag);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} 
                      />
                    </div>
                    
                    {(msg.imageUrls && msg.imageUrls.length > 0) ? (
                      <div className={`mt-2 mb-2 border-y border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 grid gap-0.5 ${msg.imageUrls.length === 1 ? 'grid-cols-1' : msg.imageUrls.length === 2 ? 'grid-cols-2' : msg.imageUrls.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                        {msg.imageUrls.map((url, i) => (
                           <div key={i} className={`${msg.imageUrls.length === 3 && i === 0 ? 'col-span-2' : ''}`}>
                             <SmartImage src={url} className={`w-full object-cover border border-gray-100 dark:border-gray-700 ${msg.imageUrls.length === 1 ? 'max-h-[500px] h-auto' : 'h-64'}`} />
                           </div>
                        ))}
                      </div>
                    ) : msg.imageUrl ? (
                      <div className="mt-2 mb-2 border-y border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-center">
                        <SmartImage src={msg.imageUrl} className="w-full h-auto max-h-[500px] object-cover" />
                      </div>
                    ) : null}

                    <div className="px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={() => setExpandedPost(expandedPost === msg.id ? null : msg.id)}
                          className="flex items-center gap-2 hover:text-primary transition-colors group"
                        >
                          <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                          </div>
                          <span className="text-sm font-semibold">{msg.commentCount || 0}</span>
                        </button>

                        <button 
                          onClick={() => handleToggleLike(msg.id, msg.likes, msg.userId, msg.text)}
                          className={`flex items-center gap-2 transition-colors group ${user && msg.likes?.includes(user.uid) ? 'text-red-500' : 'hover:text-red-500'}`}
                        >
                          <div className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill={user && msg.likes?.includes(user.uid) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          </div>
                          <span className="text-sm font-semibold">{msg.likes?.length || 0}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {user && msg.userId !== user.uid && (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleStartPrivateChat(msg.userId, msg.user);
                             }}
                             className="flex items-center gap-2 hover:text-primary transition-colors group"
                             title="Send Private Message"
                           >
                             <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                 <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                               </svg>
                             </div>
                           </button>
                        )}
                        <button className="flex items-center gap-2 hover:text-blue-500 transition-colors group">
                          <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {expandedPost === msg.id && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-5">
                        <CommentSection 
                          postId={msg.id} 
                          postAuthorId={msg.userId}
                          postTitle={msg.text.slice(0, 30) + '...'}
                          onLogin={onLogin}
                        />
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR (Trending & Suggestions) */}
        <div className="hidden xl:block w-80 shrink-0">
          <div className="sticky top-24 space-y-6">
            
            {/* Trending Topics Widget */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-colors duration-300">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Trending Topics</h3>
              {trendingTopics.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Not enough data yet.</p>
              ) : (
                <ul className="space-y-4">
                  {trendingTopics.map((topic, i) => (
                    <li key={i} onClick={() => setSelectedCategory(topic.id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -mx-2 rounded-xl transition-colors">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-0.5">{topic.label}</p>
                      <p className="font-bold text-gray-900 dark:text-white leading-tight">{topic.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{topic.count} posts</p>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => setSelectedCategory('all')} className="w-full mt-4 text-primary font-bold text-sm hover:underline text-left">Show all categories</button>
            </div>

            {/* Who to follow / Connect */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-colors duration-300">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Active Members</h3>
              {activeMembers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No active members yet.</p>
              ) : (
                <ul className="space-y-4">
                  {activeMembers.map((member, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-500 dark:text-gray-300 overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
                          {member.photoURL ? (
                            <img src={member.photoURL} className="w-full h-full object-cover" />
                          ) : (
                            member.name[0]?.toUpperCase() || '👤'
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{member.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{member.role === 'current' ? '🎓 Current' : '✈️ Incoming'}</span>
                        </div>
                      </div>
                      <button className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-1.5 rounded-full transition-colors shrink-0">
                        Connect
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="text-xs text-gray-400 font-medium px-2">
              <p>© 2026 AfroEdugo Social. All rights reserved.</p>
              <div className="flex gap-3 mt-1">
                <a href="#" className="hover:underline">Privacy Policy</a>
                <a href="#" className="hover:underline">Terms of Service</a>
              </div>
            </div>
            
          </div>
        </div>

      </div>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  )
}

export default CommunityScreen
