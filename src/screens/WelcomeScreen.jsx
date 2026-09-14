import React from 'react'

const WelcomeScreen = ({ onStart }) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] px-4 py-6 sm:p-6 text-center overflow-x-hidden">
      {/* 1. Ambient Background Glow (Subtle & Elegant) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      
      {/* 2. Responsive Icon Box */}
      <div className="mt-2 sm:mt-4 mb-4 md:mb-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 icon-box flex items-center justify-center shadow-lg shadow-primary/20">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
      </div>

      {/* 3. Title Section */}
      <div className="mb-3 sm:mb-4 md:mb-5">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold flex flex-col items-center gap-1 sm:gap-1.5">
          <span className="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-sm sm:text-base md:text-xl font-semibold">
            <span>🌍</span> Welcome to
          </span>
          <span className="text-primary dark:text-primary-light text-3xl sm:text-4xl md:text-6xl tracking-tight font-black">AfroEduGo</span>
        </h1>
      </div>

      {/* 4. Subtitle and Description */}
      <div className="mb-4 sm:mb-5 md:mb-6 max-w-sm space-y-1 sm:space-y-1.5">
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
          Your trusted companion for studying and living in Europe.
        </p>
        <p className="text-gray-400 font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-wider">
          Verified Universities • Safe Housing • Community
        </p>
      </div>

      {/* 5. Info Badges Row */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-5 sm:mb-6 md:mb-7 w-full max-w-md">
        <div className="badge bg-white dark:bg-gray-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-primary/10 shadow-sm flex items-center gap-1.5">
          <span className="text-primary text-base">🇱🇹</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Lithuania (More Soon)</span>
        </div>
        <div className="badge bg-white dark:bg-gray-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-primary/10 shadow-sm flex items-center gap-1.5">
          <span className="text-primary text-base font-bold">✓</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Verified Direct Admissions</span>
        </div>
      </div>

      {/* 6. Primary Action Button */}
      <div className="w-full max-w-sm px-4">
        <button 
          onClick={onStart}
          className="w-full py-3.5 sm:py-4 md:py-4.5 rounded-2xl button-primary text-base md:text-lg font-bold shadow-xl shadow-primary/25 flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer hover:shadow-2xl transition-all"
        >
          <span>Get Started</span>
          <span className="text-xl">→</span>
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen


