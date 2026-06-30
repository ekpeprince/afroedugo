'use client';
import React from 'react';

/**
 * NotificationPromptModal
 *
 * A gorgeous custom modal to explain the benefits of notifications
 * and prompt the user to enable them.
 *
 * Props:
 *   isOpen    - boolean
 *   onConfirm - () => void
 *   onCancel  - () => void
 */
export default function NotificationPromptModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
      onClick={onCancel}
    >
      <div 
        className="relative bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full text-center flex flex-col items-center animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow Ring and Bell Icon */}
        <div className="relative w-20 h-20 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-white text-4xl shadow-xl shadow-purple-500/20 mb-6 group hover:scale-105 transition-transform duration-300">
          {/* Pulsing ring behind the icon */}
          <span className="absolute inset-0 rounded-3xl bg-purple-500/30 animate-ping opacity-75"></span>
          <span className="relative z-10 animate-bounce duration-1000">🔔</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-2">
          Stay Connected! 🎓
        </h3>

        {/* Description */}
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed px-2 mb-6">
          Get real-time updates and notifications when a landlord replies to your housing request, or when a fellow student replies to your post in the community discussion!
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/30 hover:scale-[1.02] active:scale-98 transition-all duration-200"
          >
            Enable Notifications
          </button>
          
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-98 transition-all duration-200 text-center"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
