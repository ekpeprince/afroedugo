import React from 'react'

const WelcomeScreen = ({ onStart }) => {
  return (
    <div className="relative flex flex-col items-center min-h-screen p-6 text-center">
      {/* 1. Ambient Background Glow (Subtle & Elegant) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      
      {/* 2. Responsive Icon Box */}
      <div className="mt-8 mb-6 md:mt-16 md:mb-10">
        <div className="w-28 h-28 md:w-36 md:h-36 icon-box flex items-center justify-center">
          <svg className="w-12 h-12 md:w-16 md:h-16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
      </div>

      {/* 3. Title Section */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-3xl md:text-5xl font-bold flex flex-col items-center gap-1.5 md:gap-2">
          <span className="flex items-center gap-2 text-gray-800 dark:text-gray-200 text-lg md:text-2xl font-semibold">
            <span>🌍</span> Welcome to
          </span>
          <span className="text-primary dark:text-primary-light text-4xl md:text-6xl tracking-tight font-black">AfroEduGo</span>
        </h1>
      </div>

      {/* 4. Subtitle and Description */}
      <div className="mb-6 md:mb-10 max-w-sm space-y-2 md:space-y-3">
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
          Your trusted companion for studying and living in Europe.
        </p>
        <p className="text-gray-400 font-bold text-xs md:text-sm uppercase tracking-wider">
          Verified Universities • Safe Housing • Community
        </p>
      </div>

      {/* 5. Info Badges Row */}
      <div className="flex flex-wrap justify-center gap-x-6 md:gap-x-10 gap-y-3 mb-8 md:mb-16 w-full max-w-md">
        <div className="badge bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-primary/10 shadow-sm">
          <span className="text-primary text-base">🇱🇹</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Lithuania (More Soon)</span>
        </div>
        <div className="badge bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-primary/10 shadow-sm">
          <span className="text-primary text-base font-bold">✓</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Verified Direct Admissions</span>
        </div>
      </div>

      {/* 6. Primary Action Button */}
      <div className="w-full max-w-sm px-4 mt-auto mb-6 md:mb-10">
        <button 
          onClick={onStart}
          className="w-full py-4 md:py-5 rounded-2xl button-primary text-base md:text-lg font-bold shadow-xl shadow-primary/25 flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
        >
          <span>Get Started</span>
          <span className="text-xl">→</span>
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen


