import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, storage } from '../firebase/config';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, where, Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';

// ──────────────────────────────────────────────
// Story Viewer Overlay
// ──────────────────────────────────────────────
function StoryViewer({ stories, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const DURATION = 5000;

  useEffect(() => {
    setProgress(0);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(intervalRef.current);
          if (current < stories.length - 1) {
            setCurrent(c => c + 1);
          } else {
            onClose();
          }
          return 0;
        }
        return prev + (100 / (DURATION / 100));
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [current, stories.length, onClose]);

  const story = stories[current];
  if (!story) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
      onClick={onClose}
    >
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{
                width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
                transition: i === current ? 'width 0.1s linear' : 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center gap-3 z-10">
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {story.userPhotoURL
            ? <img src={story.userPhotoURL} className="w-full h-full object-cover" alt="" />
            : story.userName?.[0]?.toUpperCase() || '👤'
          }
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight drop-shadow">{story.userName}</p>
          <p className="text-white/60 text-xs">
            {story.createdAt?.toDate
              ? (() => {
                  const d = story.createdAt.toDate();
                  const diff = Math.floor((Date.now() - d) / 3600000);
                  return diff < 1 ? 'Just now' : `${diff}h ago`;
                })()
              : 'Just now'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div
        className="w-full max-w-sm h-full max-h-[80vh] relative flex flex-col items-center justify-center px-6 select-none"
        onClick={e => e.stopPropagation()}
      >
        {story.imageUrl ? (
          <img
            src={story.imageUrl}
            alt="Story"
            className="w-full h-full max-h-[75vh] object-contain rounded-2xl"
          />
        ) : (
          <div
            className="w-full rounded-3xl flex items-center justify-center p-10 text-center min-h-[300px]"
            style={{ background: story.bg || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <p className="text-white text-2xl font-black leading-tight break-words">
              {story.text}
            </p>
          </div>
        )}
      </div>

      {/* Tap zones for navigation */}
      <button
        onClick={e => { e.stopPropagation(); if (current > 0) setCurrent(c => c - 1); }}
        className="absolute left-0 top-0 bottom-0 w-1/3 z-20 opacity-0"
        aria-label="Previous story"
      />
      <button
        onClick={e => {
          e.stopPropagation();
          if (current < stories.length - 1) setCurrent(c => c + 1); else onClose();
        }}
        className="absolute right-0 top-0 bottom-0 w-1/3 z-20 opacity-0"
        aria-label="Next story"
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// Add Story Modal
// ──────────────────────────────────────────────
const BG_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

function AddStoryModal({ onClose, onSubmit }) {
  const [text, setText] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_GRADIENTS[0]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setText('');
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && !imageFile) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ text, bg: selectedBg, imageFile });
      onClose();
    } catch (error) {
      console.error("Error sharing story:", error);
      alert("Failed to share story. Please check your connection or permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Add Your Story</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview */}
          <div
            className="w-full h-44 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ background: imagePreview ? '#111' : selectedBg }}
          >
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-cover" alt="" />
            ) : (
              <p className="text-white font-black text-xl text-center px-4 break-words drop-shadow-lg">
                {text || 'Your story text…'}
              </p>
            )}
          </div>

          {/* Text input */}
          {!imageFile && (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write something inspiring…"
              rows={2}
              maxLength={120}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:border-primary font-medium text-gray-900 text-sm"
            />
          )}

          {/* BG picker */}
          {!imageFile && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {BG_GRADIENTS.map((bg, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedBg(bg)}
                  className={`w-8 h-8 rounded-full shrink-0 transition-all ${selectedBg === bg ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'}`}
                  style={{ background: bg }}
                />
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              📸 Photo
            </button>
            {imageFile && (
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-200 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                ✕ Remove
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!text.trim() && !imageFile)}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-colors disabled:opacity-40"
          >
            {isSubmitting ? 'Sharing…' : 'Share Story'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main StoriesBar
// ──────────────────────────────────────────────
export default function StoriesBar({ onLogin }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [stories, setStories] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Fetch stories from last 24h
  useEffect(() => {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 24 * 3600 * 1000));
    const q = query(
      collection(db, 'stories'),
      where('createdAt', '>', cutoff),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Group stories by user (most recent post-per-user first)
  const grouped = useMemo(() => {
    const map = {};
    stories.forEach(s => {
      if (!map[s.userId]) {
        map[s.userId] = { userId: s.userId, userName: s.userName, userPhotoURL: s.userPhotoURL, stories: [] };
      }
      map[s.userId].stories.push(s);
    });
    return Object.values(map);
  }, [stories]);

  const handleAddStory = async ({ text, bg, imageFile }) => {
    if (!user) return;
    let imageUrl = null;
    if (imageFile) {
      const storageRef = ref(storage, `stories/${user.uid}_${Date.now()}`);
      const snap = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, 'stories'), {
      userId: user.uid,
      userName: profile?.displayName || user.displayName || user.email.split('@')[0],
      userPhotoURL: profile?.photoURL || user?.photoURL || null,
      text: text || '',
      bg,
      imageUrl,
      createdAt: serverTimestamp(),
    });
  };

  // Flat list for the viewer
  const allStories = grouped.flatMap(g => g.stories);

  // Get the flat starting index for a grouped item
  const getStartIndex = (groupIndex) => {
    let idx = 0;
    for (let i = 0; i < groupIndex; i++) idx += grouped[i].stories.length;
    return idx;
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-colors duration-300">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">

          {/* Add Story button */}
          <button
            onClick={() => user ? setIsAddOpen(true) : onLogin?.()}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all relative overflow-hidden">
              {profile?.photoURL || user?.photoURL ? (
                <img src={profile?.photoURL || user?.photoURL} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" alt="" />
              ) : null}
              <span className="relative text-xl">➕</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-14 text-center leading-tight">
              {user ? 'Your Story' : 'Add Story'}
            </span>
          </button>

          {/* Story avatars */}
          {grouped.map((group, gi) => {
            const isMe = group.userId === user?.uid;
            return (
              <button
                key={group.userId}
                onClick={() => setViewerIndex(getStartIndex(gi))}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div className={`w-14 h-14 rounded-full p-0.5 ${isMe ? 'bg-gradient-to-br from-primary to-purple-500' : 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500'} shadow-md group-hover:scale-105 transition-transform`}>
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 p-0.5 overflow-hidden flex items-center justify-center">
                    {group.userPhotoURL ? (
                      <img src={group.userPhotoURL} className="w-full h-full object-cover rounded-full" alt="" />
                    ) : (
                      <span className="text-gray-700 dark:text-gray-200 font-bold text-lg">
                        {group.userName?.[0]?.toUpperCase() || '👤'}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 w-14 text-center leading-tight truncate">
                  {isMe ? 'You' : group.userName}
                </span>
              </button>
            );
          })}

          {grouped.length === 0 && (
            <div className="flex items-center gap-2 text-gray-400 text-sm font-medium ml-2 self-center">
              <span className="text-xl">📸</span>
              <span>No stories yet — be the first!</span>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer */}
      {viewerIndex !== null && allStories.length > 0 && (
        <StoryViewer
          stories={allStories}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {/* Add Story Modal */}
      {isAddOpen && (
        <AddStoryModal
          onClose={() => setIsAddOpen(false)}
          onSubmit={handleAddStory}
        />
      )}
    </>
  );
}
