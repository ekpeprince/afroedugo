'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

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

/**
 * UserProfileViewer
 *
 * Drop-in modal that shows a user's public profile card.
 * Props:
 *   userId      – Firestore uid of the user to display
 *   isOpen      – boolean
 *   onClose     – () => void
 *   onMessage   – (userId, displayName) => void   (optional – opens chat)
 *   initialData – { displayName, photoURL } snapshot already on hand (optional)
 */
export default function UserProfileViewer({ userId, isOpen, onClose, onMessage, initialData }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imgZoomed, setImgZoomed] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setProfile(null);
    setImgZoomed(false);

    // Optimistically render what we already know while loading
    if (initialData) setProfile(initialData);

    setLoading(true);
    const unsub = onSnapshot(doc(db, 'users', userId), (snap) => {
      if (snap.exists()) {
        setProfile({ ...snap.data(), uid: snap.id });
      }
      setLoading(false);
    }, (err) => {
      console.error("Error loading user profile:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const name    = profile?.displayName || profile?.email?.split('@')[0] || 'Unknown User';
  const photo   = profile?.photoURL || null;
  const bio     = profile?.bio || null;
  const major   = profile?.major || null;
  const country = profile?.country || null;
  const role    = profile?.role || 'incoming';
  const initial = name[0]?.toUpperCase() || '?';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
        onClick={onClose}
      >
        {/* Card */}
        <div
          className="relative bg-white/90 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 transition-all"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Banner - Mesh Gradient + Abstract SVG shapes */}
          <div className="relative h-32 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-amber-400 overflow-hidden">
            {/* SVG mesh glow/grain effect */}
            <svg className="absolute inset-0 w-full h-full opacity-20 mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
              <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch" />
                <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.07 0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noise)" />
            </svg>
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pink-500/30 rounded-full blur-2xl" />
          </div>

          {/* Close button inside card */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/35 text-white rounded-full backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          {/* Avatar Area */}
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col items-center -mt-16 mb-5">
              {/* Profile Photo Zoom Trigger */}
              <button
                onClick={() => photo && setImgZoomed(true)}
                className={`relative w-28 h-28 rounded-full border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-3xl font-black text-slate-400 transition-all duration-300 ${photo ? 'hover:scale-105 cursor-zoom-in' : 'cursor-default'}`}
                aria-label="View profile photo"
              >
                {photo ? (
                  <img src={photo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="bg-gradient-to-br from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">{initial}</span>
                )}
                {photo && (
                  <span className="absolute inset-0 bg-black/0 hover:bg-black/25 transition-all duration-300 flex items-center justify-center group">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-bold bg-black/60 px-2.5 py-1 rounded-full transition-opacity duration-300">View</span>
                  </span>
                )}
              </button>

              {/* Name & Role badge */}
              <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white text-center leading-tight tracking-tight">
                {loading && !profile ? (
                  <span className="inline-block w-36 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                ) : name}
              </h2>

              {/* Online/Offline Status Indicator */}
              <div className="flex items-center gap-1.5 mt-2 bg-slate-50 dark:bg-slate-800/40 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800/30 shadow-sm animate-in fade-in duration-200">
                <span className={`w-2 h-2 rounded-full ${
                  profile?.status === 'online' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-400'
                }`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {profile?.status === 'online' ? 'Online' : 'Offline'}
                </span>
                {profile?.status !== 'online' && profile?.lastOnline && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 normal-case font-medium">
                    • Active {formatLastOnline(profile.lastOnline)}
                  </span>
                )}
              </div>

              <span className={`mt-2.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border ${
                role === 'current'
                  ? 'bg-emerald-50/80 text-emerald-600 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : 'bg-indigo-50/80 text-indigo-600 border-indigo-200/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
              }`}>
                {role === 'current' ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>🎓 Current Student</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <span>✈️ Incoming Student</span>
                  </>
                )}
              </span>
            </div>

            {/* Info Grid (Major & Country) */}
            {(major || country) && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                {major && (
                  <div className="flex flex-col items-start p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/30 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5V4.5z"/>
                      </svg>
                      <span>Major</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-full" title={major}>
                      {major}
                    </span>
                  </div>
                )}
                {country && (
                  <div className="flex flex-col items-start p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/30 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      <span>Home</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-full" title={country}>
                      {country}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bio Section */}
            {bio && (
              <div className="relative p-4 mb-6 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-800/30 rounded-2xl text-center leading-relaxed">
                <svg className="absolute top-2 left-2 w-5 h-5 text-slate-200 dark:text-slate-800 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-4.319 3.823-4.319 6.356h6.324v9.509h-11.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.154c-2.41 1.012-4.3 3.917-4.3 6.452h6.304v9.394h-12z"/>
                </svg>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 italic px-4 relative z-10">
                  {bio}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {onMessage && (
                <button
                  onClick={() => { onMessage(userId, name); onClose(); }}
                  className="flex-grow flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/30 hover:scale-[1.02] active:scale-98 active:shadow-sm transition-all duration-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Message</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-grow flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-98 transition-all duration-200 text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      {imgZoomed && photo && (
        <div
          className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
          onClick={() => setImgZoomed(false)}
        >
          <button
            onClick={() => setImgZoomed(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors active:scale-95"
            aria-label="Close photo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <img
            src={photo}
            alt={name}
            className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl object-contain animate-in zoom-in-95 duration-200"
          />
          <p className="absolute bottom-6 text-white/70 text-sm font-bold tracking-tight">{name}</p>
        </div>
      )}
    </>
  );
}
