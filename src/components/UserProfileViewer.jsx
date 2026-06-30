'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

/**
 * UserProfileViewer
 *
 * Drop-in modal that shows a user's public profile card.
 * Props:
 *   userId    – Firestore uid of the user to display
 *   isOpen    – boolean
 *   onClose   – () => void
 *   onMessage – (userId, displayName) => void   (optional – opens chat)
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
    getDoc(doc(db, 'users', userId))
      .then(snap => {
        if (snap.exists()) setProfile({ ...snap.data(), uid: snap.id });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
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
      {/* ── BACKDROP ───────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* ── CARD ──────────────────────────────────────────────────────── */}
        <div
          className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Gradient header band */}
          <div className="h-28 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          {/* ── AVATAR ─────────────────────────────────────────────────── */}
          <div className="px-6 pb-6">
            <div className="flex flex-col items-center -mt-14 mb-4">
              {/* Clickable avatar → zoomed lightbox */}
              <button
                onClick={() => photo && setImgZoomed(true)}
                className={`relative w-28 h-28 rounded-full border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-3xl font-black text-gray-500 transition-transform ${photo ? 'hover:scale-105 cursor-zoom-in' : 'cursor-default'}`}
                aria-label="View profile photo"
              >
                {photo
                  ? <img src={photo} alt={name} className="w-full h-full object-cover" />
                  : initial
                }
                {photo && (
                  <span className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 hover:opacity-100 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-full transition-opacity">View</span>
                  </span>
                )}
              </button>

              {/* Name & role badge */}
              <h2 className="mt-3 text-xl font-black text-gray-900 dark:text-white text-center leading-tight">
                {loading && !profile ? (
                  <span className="inline-block w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : name}
              </h2>

              <span className={`mt-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                role === 'current'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {role === 'current' ? '🎓 Current Student' : '✈️ Incoming Student'}
              </span>
            </div>

            {/* ── INFO PILLS ─────────────────────────────────────────── */}
            {(major || country) && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {major && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300">
                    📚 {major}
                  </span>
                )}
                {country && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300">
                    🌍 {country}
                  </span>
                )}
              </div>
            )}

            {/* ── BIO ────────────────────────────────────────────────── */}
            {bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed mb-5 px-2">
                "{bio}"
              </p>
            )}

            {/* ── ACTION BUTTONS ─────────────────────────────────────── */}
            <div className="flex gap-3">
              {onMessage && (
                <button
                  onClick={() => { onMessage(userId, name); onClose(); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2.5 rounded-xl font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Message
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PHOTO LIGHTBOX (zoom on tap avatar) ─────────────────────────── */}
      {imgZoomed && photo && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImgZoomed(false)}
        >
          <button
            onClick={() => setImgZoomed(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            aria-label="Close photo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <img
            src={photo}
            alt={name}
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-200"
          />
          <p className="absolute bottom-6 text-white/70 text-sm font-semibold">{name}</p>
        </div>
      )}
    </>
  );
}
