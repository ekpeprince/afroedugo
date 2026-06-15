import React from 'react'

const WelcomeScreen = ({ onStart }) => {
  return (
    <div className="relative flex flex-col items-center min-h-screen p-6 text-center">
      {/* 1. Large Circular Background Element (Subtle) */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-30 -z-10"></div>
      
      {/* 2. Responsive Green Icon Box */}
      <div className="mt-8 mb-6 md:mt-16 md:mb-10">
        <div className="w-28 h-28 md:w-40 md:h-40 icon-box flex items-center justify-center">
          <svg className="w-12 h-12 md:w-20 md:h-20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
      </div>

      {/* 3. Title Section */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-3xl md:text-5xl font-bold flex flex-col items-center gap-1.5 md:gap-2">
          <span className="flex items-center gap-2 text-gray-900 text-xl md:text-3xl">
            <span>🎓</span> Welcome to
          </span>
          <span className="text-primary text-4xl md:text-6xl tracking-tight font-black">AfroEduGo</span>
        </h1>
      </div>

      {/* 4. Subtitle and Description */}
      <div className="mb-6 md:mb-10 max-w-sm space-y-2 md:space-y-4">
        <p className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed">
          Your simple guide to studying in Europe 🌍
        </p>
        <p className="text-gray-400 font-bold text-xs md:text-sm">
          Find schools, housing & support services
        </p>
      </div>

      {/* 5. Info Badges Row */}
      <div className="flex flex-wrap justify-center gap-x-8 md:gap-x-12 gap-y-3 mb-8 md:mb-16 w-full max-w-md">
        <div className="badge">
          <span className="text-green-500 text-lg md:text-xl">🌐</span>
          <span className="text-xs md:text-sm">Lithuania (Others Soon!)</span>
        </div>
        <div className="badge">
          <span className="text-green-500 text-lg md:text-xl font-bold">💚</span>
          <span className="text-xs md:text-sm">Verified Options</span>
        </div>
      </div>

      {/* 6. Primary Action Button */}
      <div className="w-full max-w-sm px-4 mt-auto mb-6 md:mb-10">
        <button 
          onClick={onStart}
          className="w-full py-4 md:py-5 rounded-3xl button-primary text-lg md:text-xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
        >
          <span className="text-xl md:text-2xl">👉</span>
          Get Started
          <span className="text-xl md:text-2xl">→</span>
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen


