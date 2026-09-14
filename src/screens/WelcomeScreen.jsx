import React from 'react'

const WelcomeScreen = ({ onStart }) => {
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

      {/* 5. Primary Action Button (Moved up prominently) */}
      <div className="w-full max-w-sm px-4 mb-4 sm:mb-5">
        <button 
          onClick={onStart}
          className="w-full py-3.5 sm:py-4 md:py-4.5 rounded-2xl button-primary text-base md:text-lg font-bold shadow-xl shadow-primary/25 flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer hover:shadow-2xl transition-all"
        >
          <span>Get Started</span>
          <span className="text-xl">→</span>
        </button>
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
  )
}

export default WelcomeScreen


