'use client';
import React from 'react';

/**
 * InstallPromptModal
 *
 * A custom modal prompting the user to install the AfroEduGo PWA app
 * on their home screen for a native feel.
 *
 * Props:
 *   isOpen    - boolean
 *   onConfirm - () => void
 *   onCancel  - () => void
 */
export default function InstallPromptModal({ isOpen, onConfirm, onCancel }) {
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
        {/* Glow Ring and PWA Icon */}
        <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 rounded-3xl flex items-center justify-center text-white text-4xl shadow-xl shadow-teal-500/20 mb-6 group hover:scale-105 transition-transform duration-300">
          {/* Pulsing ring behind the icon */}
          <span className="absolute inset-0 rounded-3xl bg-teal-500/30 animate-ping opacity-75"></span>
          <span className="relative z-10 animate-bounce duration-1000">📲</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-2">
          Install AfroEduGo App
        </h3>

        {/* Description */}
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed px-2 mb-6">
          Add AfroEduGo to your home screen for instant access, offline support, and a fast, full-screen mobile app experience!
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-98 transition-all duration-200"
          >
            Install App
          </button>
          
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-98 transition-all duration-200 text-center"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
