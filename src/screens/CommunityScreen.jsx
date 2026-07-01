import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { db, storage } from '../firebase/config'
import {
  collection, addDoc, serverTimestamp, doc, updateDoc,
  arrayUnion, arrayRemove, deleteDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useChat } from '../hooks/useChat'
import { compressImage } from '../utils/imageCompressor'
import CommentSection from '../components/CommentSection'
import SmartImage from '../components/SmartImage'
import ProfileModal from '../components/ProfileModal'
import NotificationsDropdown from '../components/NotificationsDropdown'
import PostText from '../components/PostText'
import StoriesBar from '../components/StoriesBar'
import { useNotifications } from '../hooks/useNotifications'
import { notifyUser } from '../utils/notifyUser'
import UserProfileViewer from '../components/UserProfileViewer'
import NetworkMatch from '../components/NetworkMatch'

const CommunityScreen = ({ onBack, onOpenChat, onOpenMessages, onOpenNotifications, onLogin }) => {
  const { user } = useAuth();
  const { getOrCreateConversation, unreadDMsCount } = useChat();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [savedView, setSavedView] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  // User profile viewer (click on any avatar)
  const [viewingUser, setViewingUser] = useState(null); // { userId, displayName, photoURL }
  const [openMenuId, setOpenMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'matches'
  const [attachedImages, setAttachedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const { data: discussions, loading } = useFirestore('discussions', 'createdAt');

  // ── Load saved posts from user profile ──────────────────────────────────
  useEffect(() => {
    setSavedPosts(profile?.savedPosts || []);
  }, [profile]);

  // ── Close post options menu on outside click ─────────────────────────────
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  // ── Categories ───────────────────────────────────────────────────────────
  const categories = [
    { id: 'all',         label: 'All',          icon: '🌐' },
    { id: 'general',     label: 'General',      icon: '💬' },
    { id: 'visa',        label: 'Visa Help',    icon: '📄' },
    { id: 'housing',     label: 'Housing',      icon: '🏠' },
    { id: 'study',       label: 'Study Tips',   icon: '📚' },
    { id: 'scholarship', label: 'Scholarships', icon: '🎓' },
    { id: 'jobs',        label: 'Jobs',         icon: '💼' },
  ];

  const categoryTitles = {
    general:     'General discussions across the board',
    visa:        'Latest questions and updates on visas',
    housing:     'Tips and questions on accommodation',
    study:       'Study strategies and academic tips',
    scholarship: 'Scholarship opportunities and guidance',
    jobs:        'Part-time jobs and career opportunities',
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStartPrivateChat = async (userId, userName) => {
    if (!user) { onLogin?.(); return; }
    if (userId === user.uid) return;
    const convId = await getOrCreateConversation(userId, { type: 'student-to-student' });
    if (convId) onOpenChat(convId);
  };

  const handleToggleLike = async (postId, likes = [], postAuthorId, postText, authorFcmToken) => {
    if (!user) { onLogin?.(); return; }
    const isLiked = likes?.includes(user.uid);
    try {
      await updateDoc(doc(db, 'discussions', postId), {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      if (!isLiked && postAuthorId && postAuthorId !== user.uid) {
        const senderName = profile?.displayName || user.displayName || user.email.split('@')[0];
        const snippet = (postText || '').slice(0, 40);
        await addDoc(collection(db, 'notifications'), {
          userId: postAuthorId,
          senderId: user.uid,
          senderName,
          senderPhotoURL: profile?.photoURL || user?.photoURL || null,
          postId,
          title: '❤️ New Like!',
          message: `${senderName} liked your post: "${snippet}..."`,
          type: 'like',
          link: 'community',
          read: false,
          createdAt: serverTimestamp()
        });
        // Push notification even when app is closed
        notifyUser(postAuthorId, '❤️ New Like!', `${senderName} liked your post`);
      }
    } catch (err) { console.error('Error toggling like:', err); }
  };

  const handleSavePost = async (postId) => {
    if (!user) { onLogin?.(); return; }
    const isSaved = savedPosts.includes(postId);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        savedPosts: isSaved ? arrayRemove(postId) : arrayUnion(postId)
      });
      setSavedPosts(prev => isSaved ? prev.filter(id => id !== postId) : [...prev, postId]);
    } catch (err) { console.error('Error saving post:', err); }
  };

  const handleDeletePost = async (postId) => {
    if (!user) return;
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'discussions', postId));
    } catch (err) { console.error('Error deleting post:', err); }
    setOpenMenuId(null);
  };

  const handleReportPost = async (postId) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'discussions', postId), { isReported: true });
      alert('Post reported. Thank you for keeping the community safe! 🙏');
    } catch (err) { console.error('Error reporting post:', err); }
    setOpenMenuId(null);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      // Compress each image file concurrently client-side
      const compressedFiles = await Promise.all(
        files.map(file => compressImage(file))
      );
      const newFiles = [...attachedImages, ...compressedFiles].slice(0, 4);
      setAttachedImages(newFiles);
      setImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
    } catch (err) {
      console.error('Image compression failed, falling back to original files:', err);
      const newFiles = [...attachedImages, ...files].slice(0, 4);
      setAttachedImages(newFiles);
      setImagePreviews(newFiles.map(f => URL.createObjectURL(f)));
    }
  };

  const removeImage = (index) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachedImages.length === 0) return;
    if (!user) { onLogin?.(); return; }
    setIsSending(true);
    try {
      let imageUrls = [];
      for (const file of attachedImages) {
        const snap = await uploadBytes(ref(storage, `community/${user.uid}_${Date.now()}_${file.name}`), file);
        imageUrls.push(await getDownloadURL(snap.ref));
      }
      const postCategory = selectedCategory === 'all' ? 'general' : selectedCategory;
      await addDoc(collection(db, 'discussions'), {
        text: newMessage,
        category: postCategory,
        createdAt: serverTimestamp(),
        userId: user.uid,
        user: profile?.displayName || user.displayName || user.email.split('@')[0],
        userEmail: user.email,
        userCountry: profile?.country || '',
        userMajor: profile?.major || '',
        userRole: profile?.role || 'incoming',
        userPhotoURL: profile?.photoURL || user?.photoURL || null,
        likes: [],
        commentCount: 0,
        imageUrls,
        imageUrl: imageUrls[0] || ''
      });
      setNewMessage('');
      setAttachedImages([]);
      setImagePreviews([]);
    } catch (err) {
      console.error('Error sending post:', err);
      alert('Failed to publish post. If you attached photos, please make sure they are less than 5MB and try again.');
    }
    finally { setIsSending(false); }
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const filteredDiscussions = useMemo(() => {
    let posts = discussions.filter(d =>
      (selectedCategory === 'all' || d.category === selectedCategory) &&
      ((d.text || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (savedView) posts = posts.filter(d => savedPosts.includes(d.id));
    return posts;
  }, [discussions, selectedCategory, searchTerm, savedView, savedPosts]);

  const trendingTopics = useMemo(() => {
    if (!discussions) return [];
    const counts = {};
    discussions.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([catId, count]) => ({
        id: catId,
        label: categories.find(c => c.id === catId)?.label || catId,
        icon: categories.find(c => c.id === catId)?.icon || '📌',
        title: categoryTitles[catId] || catId,
        count
      }));
  }, [discussions]);

  const activeMembers = useMemo(() => {
    if (!discussions) return [];
    const userMap = {};
    discussions.forEach(d => {
      if (d.userId && !userMap[d.userId]) {
        userMap[d.userId] = {
          userId: d.userId,
          name: d.user,
          role: d.userRole,
          country: d.userCountry,
          photoURL: d.userPhotoURL,
          count: 0
        };
      }
      if (d.userId) userMap[d.userId].count += 1;
    });
    return Object.values(userMap).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [discussions]);

  const formatTime = (ts) => {
    if (!ts?.toDate) return 'Just now';
    const date = ts.toDate();
    const diffMs = Date.now() - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-gray-900 transition-colors duration-300 flex flex-col font-sans">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 z-30 h-16 flex items-center justify-between px-4 sm:px-8 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-700 dark:text-gray-300">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-none whitespace-nowrap">
            AfroEdugo <span className="text-primary font-black">Social</span>
          </h1>
        </div>

        {/* Unified search — all screen sizes */}
        <div className="flex-grow mx-4 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts…"
              className="w-full bg-gray-100 dark:bg-gray-700 py-2.5 pl-10 pr-4 rounded-full border-none focus:ring-2 ring-primary/30 outline-none transition-all font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-50">
          {user && (
            <button
              onClick={onOpenNotifications}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 border-2 border-white dark:border-gray-800 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
          <div
            onClick={() => setIsProfileModalOpen(true)}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-600 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all text-sm"
          >
            {profile?.photoURL || user?.photoURL ? (
              <img src={profile?.photoURL || user?.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : user ? user.email[0].toUpperCase() : '👤'}
          </div>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="flex-grow pt-20 px-4 pb-24 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 space-y-5">
            {/* Profile card */}
            {user ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center transition-colors duration-300">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold border-4 border-white dark:border-gray-800 shadow-md mb-3">
                  {profile?.photoURL || user?.photoURL
                    ? <img src={profile?.photoURL || user?.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    : user.email[0].toUpperCase()}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{profile?.displayName || user.email.split('@')[0]}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{profile?.major || 'Undecided Major'}</p>
                <div className="mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${profile?.role === 'current' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {profile?.role === 'current' ? '🎓 Current Student' : '✈️ Incoming'}
                  </span>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2 rounded-full font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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

            {/* Navigation */}
            <nav className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
              <ul className="flex flex-col py-2">
                <li>
                  <button
                    onClick={() => { setSavedView(false); setActiveTab('feed'); }}
                    className={`w-full flex items-center gap-4 px-6 py-3 text-left transition-colors font-bold border-l-4 ${!savedView && activeTab === 'feed' ? 'text-primary bg-primary/5 border-primary' : 'text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <span className="text-xl">🏠</span> Home Feed
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { if (!user) { onLogin?.(); return; } setActiveTab('matches'); setSavedView(false); }}
                    className={`w-full flex items-center gap-4 px-6 py-3 text-left transition-colors font-bold border-l-4 ${activeTab === 'matches' ? 'text-primary bg-primary/5 border-primary' : 'text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <span className="text-xl">🤝</span> Network Matches
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { if (!user) { onLogin?.(); return; } setSavedView(true); setActiveTab('feed'); }}
                    className={`w-full flex items-center gap-4 px-6 py-3 text-left transition-colors font-bold border-l-4 ${savedView ? 'text-primary bg-primary/5 border-primary' : 'text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <span className="text-xl">🔖</span>
                    Saved Posts
                    {savedPosts.length > 0 && (
                      <span className="ml-auto text-xs bg-primary text-white rounded-full px-2 py-0.5 font-bold">{savedPosts.length}</span>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { if (!user) { onLogin?.(); return; } onOpenMessages ? onOpenMessages() : onOpenChat?.(); }}
                    className="w-full flex items-center gap-4 px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 font-semibold border-l-4 border-transparent"
                  >
                    <span className="text-xl">✉️</span> Messages
                    {unreadDMsCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-black rounded-full px-2 py-0.5 animate-pulse shadow-sm shadow-red-500/20">
                        {unreadDMsCount}
                      </span>
                    )}
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* ── MAIN FEED ────────────────────────────────────────────────── */}
        <div className="flex-grow max-w-2xl w-full mx-auto min-w-0">

          {/* Stories Bar */}
          {activeTab === 'feed' && <StoriesBar onLogin={onLogin} />}

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSavedView(false); setSelectedCategory(cat.id); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-all font-bold text-sm shrink-0 ${
                  selectedCategory === cat.id && !savedView
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {activeTab === 'matches' ? (
            <div className="mt-4">
              <NetworkMatch 
                onStartChat={handleStartPrivateChat} 
                onViewProfile={(u) => setViewingUser({ userId: u.id, displayName: u.displayName, photoURL: u.photoURL })} 
              />
            </div>
          ) : (
            <>
              {/* Saved posts banner */}
              {savedView && (
                <div className="flex items-center gap-3 mb-4 bg-primary/10 border border-primary/20 text-primary rounded-2xl px-4 py-3">
              <span className="text-xl">🔖</span>
              <span className="font-bold text-sm">Showing your {savedPosts.length} saved post{savedPosts.length !== 1 ? 's' : ''}</span>
              <button onClick={() => setSavedView(false)} className="ml-auto text-xs font-bold hover:underline opacity-70 hover:opacity-100">
                Back to feed →
              </button>
            </div>
          )}

          {/* ── POST COMPOSER ─────────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-5 transition-colors duration-300">
            <form onSubmit={handleSendMessage} className="flex flex-col gap-0">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold text-sm shrink-0">
                  {profile?.photoURL || user?.photoURL
                    ? <img src={profile?.photoURL || user?.photoURL} alt="" className="w-full h-full object-cover" />
                    : user ? user.email[0].toUpperCase() : '👤'}
                </div>
                <textarea
                  placeholder={user ? `What's on your mind, ${profile?.displayName?.split(' ')[0] || 'friend'}?` : 'Log in to share your thoughts…'}
                  className="flex-grow bg-transparent pt-2 outline-none font-medium text-gray-900 dark:text-white text-base placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none min-h-[48px]"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  disabled={isSending || !user}
                  rows={newMessage.length > 60 ? 3 : 2}
                />
              </div>

              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-3 mb-1 ml-13 overflow-x-auto no-scrollbar">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className="relative shrink-0">
                      <img src={preview} className="w-24 h-24 object-cover rounded-xl border border-gray-200 shadow-sm" alt="" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs hover:bg-black transition-colors"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!user}
                  className="flex items-center gap-2 text-primary hover:bg-primary/5 px-3 py-1.5 rounded-full transition-colors font-bold text-sm disabled:opacity-40"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Photo
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                {!user ? (
                  <button type="button" onClick={onLogin} className="bg-primary text-white px-5 py-2 rounded-full font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors">
                    Log in to Post
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSending || (!newMessage.trim() && attachedImages.length === 0)}
                    className="bg-primary text-white px-6 py-2 rounded-full font-bold text-sm shadow-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40"
                  >
                    {isSending ? 'Posting…' : 'Post'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ── FEED ──────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
                    <div className="space-y-2 flex-grow">
                      <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3.5 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3.5 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              ))
            ) : filteredDiscussions.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-5xl mb-4 opacity-40">{savedView ? '🔖' : '📫'}</div>
                <p className="text-gray-900 dark:text-white font-bold text-lg">
                  {savedView ? 'No saved posts yet' : 'No posts yet'}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {savedView ? 'Bookmark posts to find them here.' : 'Be the first to share something!'}
                </p>
                {savedView && (
                  <button onClick={() => setSavedView(false)} className="mt-4 text-primary font-bold text-sm hover:underline">
                    Back to feed
                  </button>
                )}
              </div>
            ) : (
              filteredDiscussions.map(msg => {
                const isMyPost = user && msg.userId === user.uid;
                const isMenuOpen = openMenuId === msg.id;
                const isSaved = savedPosts.includes(msg.id);

                return (
                  <article key={msg.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                    {/* Post header */}
                    <div className="p-4 sm:p-5 flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => setViewingUser({ userId: msg.userId, displayName: msg.user, photoURL: msg.userPhotoURL })}
                          className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-base shrink-0 border border-gray-200 dark:border-gray-600 hover:ring-2 hover:ring-primary/50 hover:scale-105 transition-all cursor-pointer"
                          aria-label={`View ${msg.user}'s profile`}
                          title={`View ${msg.user}'s profile`}
                        >
                          {msg.userPhotoURL ? <img src={msg.userPhotoURL} alt="" className="w-full h-full object-cover" /> : '👤'}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 leading-tight">
                            <button
                              type="button"
                              onClick={() => setViewingUser({ userId: msg.userId, displayName: msg.user, photoURL: msg.userPhotoURL })}
                              className="font-bold text-gray-900 dark:text-white truncate hover:text-primary dark:hover:text-primary hover:underline transition-colors cursor-pointer"
                              title={`View ${msg.user}'s profile`}
                            >
                              {msg.user}
                            </button>
                            <span className="text-gray-400 text-xs">·</span>
                            <span className="text-gray-400 text-xs whitespace-nowrap">{formatTime(msg.createdAt)}</span>
                            {msg.category && msg.category !== 'general' && (() => {
                              const cat = categories.find(c => c.id === msg.category);
                              return cat ? (
                                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full whitespace-nowrap">
                                  {cat.icon} {cat.label}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div className="text-gray-400 text-xs mt-0.5 truncate">
                            {msg.userRole === 'current' ? '🎓 Current Student' : '✈️ Incoming'}
                            {msg.userCountry ? ` · ${msg.userCountry}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* ⋯ Options menu */}
                      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenMenuId(isMenuOpen ? null : msg.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Post options"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                          </svg>
                        </button>
                        {isMenuOpen && (
                          <div className="absolute right-0 top-9 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1 z-50 w-44 overflow-hidden">
                            {isMyPost ? (
                              <button
                                onClick={() => handleDeletePost(msg.id)}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
                              >
                                🗑️ Delete Post
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReportPost(msg.id)}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-2.5 transition-colors"
                              >
                                🚩 Report Post
                              </button>
                            )}
                            <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                            <button
                              onClick={() => { handleSavePost(msg.id); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
                            >
                              {isSaved ? '🔖 Unsave Post' : '🏷️ Save Post'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post body */}
                    <div className="px-4 sm:px-5 pb-3">
                      <PostText
                        text={msg.text}
                        onHashtagClick={tag => { setSearchTerm(tag); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      />
                    </div>

                    {/* Images */}
                    {msg.imageUrls?.length > 0 ? (
                      <div className={`mt-1 mb-1 border-y border-gray-100 dark:border-gray-700 grid gap-0.5 ${msg.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {msg.imageUrls.map((url, i) => (
                          <div key={i} className={msg.imageUrls.length === 3 && i === 0 ? 'col-span-2' : ''}>
                            <SmartImage src={url} className={`w-full object-cover ${msg.imageUrls.length === 1 ? 'max-h-[500px] h-auto' : 'h-60'}`} />
                          </div>
                        ))}
                      </div>
                    ) : msg.imageUrl ? (
                      <div className="mt-1 mb-1 border-y border-gray-100 dark:border-gray-700">
                        <SmartImage src={msg.imageUrl} className="w-full h-auto max-h-[500px] object-cover" />
                      </div>
                    ) : null}

                    {/* Action bar */}
                    <div className="px-4 sm:px-5 py-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Comment */}
                        <button
                          onClick={() => setExpandedPost(expandedPost === msg.id ? null : msg.id)}
                          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors group"
                        >
                          <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                          </div>
                          <span className="text-sm font-semibold">{msg.commentCount || 0}</span>
                        </button>

                        {/* Like */}
                        <button
                          onClick={() => handleToggleLike(msg.id, msg.likes, msg.userId, msg.text)}
                          className={`flex items-center gap-1.5 transition-colors group ${user && msg.likes?.includes(user.uid) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}
                        >
                          <div className="p-1.5 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                            <svg width="19" height="19" viewBox="0 0 24 24" fill={user && msg.likes?.includes(user.uid) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          </div>
                          <span className="text-sm font-semibold">{msg.likes?.length || 0}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* DM button */}
                        {user && msg.userId !== user.uid && (
                          <button
                            onClick={e => { e.stopPropagation(); handleStartPrivateChat(msg.userId, msg.user); }}
                            className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors group p-1.5 rounded-full hover:bg-primary/10"
                            title="Send message"
                          >
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                          </button>
                        )}

                        {/* Bookmark */}
                        <button
                          onClick={() => handleSavePost(msg.id)}
                          className={`p-1.5 rounded-full transition-colors group hover:bg-primary/10 ${isSaved ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary'}`}
                          title={isSaved ? 'Unsave post' : 'Save post'}
                        >
                          <svg width="19" height="19" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Comments */}
                    {expandedPost === msg.id && (
                      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-4 sm:p-5">
                        <CommentSection
                          postId={msg.id}
                          postAuthorId={msg.userId}
                          postTitle={(msg.text || '').slice(0, 30) + '...'}
                          onLogin={onLogin}
                        />
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
            </>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
        <div className="hidden xl:block w-80 shrink-0">
          <div className="sticky top-24 space-y-5">

            {/* Trending Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-colors duration-300">
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4">🔥 Trending</h3>
              {trendingTopics.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Not enough data yet.</p>
              ) : (
                <ul className="space-y-3">
                  {trendingTopics.map((topic, i) => (
                    <li
                      key={i}
                      onClick={() => { setSelectedCategory(topic.id); setSavedView(false); }}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -mx-2 rounded-xl transition-colors"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{topic.icon} {topic.label}</p>
                      <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight mt-0.5">{topic.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{topic.count} posts</p>
                    </li>
                  ))}
                </ul>
              )}
              <button onClick={() => setSelectedCategory('all')} className="w-full mt-4 text-primary font-bold text-sm hover:underline text-left">
                Show all →
              </button>
            </div>

            {/* Active Members */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-colors duration-300">
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4">👥 Active Members</h3>
              {activeMembers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No active members yet.</p>
              ) : (
                <ul className="space-y-4">
                  {activeMembers.map((member, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-500 dark:text-gray-300 overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600 text-sm">
                          {member.photoURL
                            ? <img src={member.photoURL} className="w-full h-full object-cover" alt="" />
                            : member.name?.[0]?.toUpperCase() || '👤'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-900 dark:text-white text-sm block truncate">{member.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {member.role === 'current' ? '🎓 Current' : '✈️ Incoming'}
                          </span>
                        </div>
                      </div>
                      {user && member.userId === user.uid ? (
                        <span className="text-xs text-gray-400 font-semibold shrink-0">You</span>
                      ) : (
                        <button
                          onClick={() => handleStartPrivateChat(member.userId, member.name)}
                          className="text-xs font-bold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-full transition-colors shrink-0"
                        >
                          Connect
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="text-xs text-gray-400 font-medium px-2">
              <p>© 2026 AfroEdugo. All rights reserved.</p>
              <div className="flex gap-3 mt-1">
                <a href="#" className="hover:underline">Privacy</a>
                <a href="#" className="hover:underline">Terms</a>
              </div>
            </div>
          </div>
        </div>

      </div>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      {/* User Profile Viewer (avatar click) */}
      <UserProfileViewer
        userId={viewingUser?.userId}
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        initialData={viewingUser ? { displayName: viewingUser.displayName, photoURL: viewingUser.photoURL } : null}
        onMessage={handleStartPrivateChat}
      />
    </div>
  );
};

export default CommunityScreen;
