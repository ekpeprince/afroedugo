import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

const WelcomeScreen = ({ onStart }) => {
  const { loginWithGoogle } = useAuth();
  const [weeklyUpdates, setWeeklyUpdates] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle({ weeklyUpdates });
      onStart?.();
    } catch (err) {
      console.error('Welcome screen Google sign-in error:', err);
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'afroedugo.com';
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage(`Domain "${domain}" is not authorized in Firebase Console.`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily closed popup
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Sign-in popup was blocked. Please allow popups for this site.');
      } else if (err.code === 'auth/internal-error') {
        setErrorMessage(`Google sign-in error (auth/internal-error). Please verify "${domain}" is added to Authorized Domains in Firebase Console.`);
      } else {
        setErrorMessage(err.message ? err.message.replace('Firebase: ', '') : 'Google sign-in failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] px-4 pt-4 pb-10 sm:py-8 text-center overflow-x-hidden">
      {/* 1. Ambient Background Glow (Subtle & Elegant) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      
      {/* 2. Responsive Icon Box */}
      <div className="mt-1 sm:mt-2 mb-3 md:mb-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 icon-box flex items-center justify-center shadow-lg shadow-primary/20">
          <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
      </div>

      {/* 3. Title Section */}
      <div className="mb-2.5 sm:mb-3.5 md:mb-4">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold flex flex-col items-center gap-1 sm:gap-1.5">
          <span className="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-sm sm:text-base md:text-xl font-semibold">
            <span>🌍</span> Welcome to
          </span>
          <span className="text-primary dark:text-primary-light text-3xl sm:text-4xl md:text-6xl tracking-tight font-black">AfroEduGo</span>
        </h1>
      </div>

      {/* 4. Subtitle and Description */}
      <div className="mb-5 sm:mb-6 max-w-sm space-y-1 sm:space-y-1.5">
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
          Your trusted companion for studying and living in Europe.
        </p>
        <p className="text-gray-400 font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-wider">
          Verified Universities • Safe Housing • Community
        </p>
      </div>

      {/* 5. Google Sign-In & Auth Actions */}
      <div className="w-full max-w-sm px-4 mb-4 sm:mb-5 space-y-3">
        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-700/60 shadow-lg shadow-gray-200/50 dark:shadow-none hover:bg-gray-50 dark:hover:bg-[#182229] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer group"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-black text-xs sm:text-sm uppercase tracking-widest text-gray-700 dark:text-gray-200">
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </span>
        </button>

        {errorMessage && (
          <p className="text-xs text-red-500 font-semibold px-2">{errorMessage}</p>
        )}

        <p className="text-center text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed px-1">
          By continuing, you agree to AfroEduGo&apos;s{' '}
          <Link href="/terms" className="text-gray-800 dark:text-gray-200 underline font-bold hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-gray-800 dark:text-gray-200 underline font-bold hover:text-primary">
            Privacy Policy
          </Link>.
        </p>

        <label className="flex items-start justify-center gap-2.5 cursor-pointer select-none text-left px-2 pt-0.5">
          <input 
            type="checkbox" 
            checked={weeklyUpdates}
            onChange={(e) => setWeeklyUpdates(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
          />
          <span className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 font-medium leading-tight">
            <span className="font-bold text-gray-500 dark:text-gray-400">(Optional)</span> Send me weekly updates on new student jobs, flats, and community posts.
          </span>
        </label>

        {/* Explore as Guest Option */}
        <div className="pt-2">
          <button 
            type="button"
            onClick={onStart}
            className="w-full py-3 rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <span>Explore as Guest</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* 6. Info Badges Row (Supporting trust signals below button) */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 w-full max-w-md">
        <div className="badge bg-white dark:bg-gray-800 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full border border-primary/10 shadow-sm flex items-center gap-1.5">
          <span className="text-primary text-base">🇱🇹</span>
          <span className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300">Lithuania (More Soon)</span>
        </div>
        <div className="badge bg-white dark:bg-gray-800 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full border border-primary/10 shadow-sm flex items-center gap-1.5">
          <span className="text-primary text-base font-bold">✓</span>
          <span className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300">Verified Direct Admissions</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
