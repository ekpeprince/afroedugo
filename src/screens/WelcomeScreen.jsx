import React from 'react'

const WelcomeScreen = ({ onStart }) => {
  return (
    <div className="relative flex flex-col items-center min-h-screen p-6 text-center">
      {/* 1. Large Circular Background Element (Subtle) */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-30 -z-10"></div>
      
      {/* 2. Large Green Icon Box */}
      <div className="mt-16 mb-10">
        <div className="w-40 h-40 icon-box flex items-center justify-center">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
      </div>

      {/* 3. Title Section */}
      <div className="mb-6">
        <h1 className="text-4xl md:text-5xl font-bold flex flex-col items-center gap-2">
          <span className="flex items-center gap-2 text-gray-900">
            <span className="text-3xl">🎓</span> Welcome to
          </span>
          <span className="text-primary text-5xl md:text-6xl tracking-tight">AfroEduGo</span>
        </h1>
      </div>

      {/* 4. Subtitle and Description */}
      <div className="mb-10 max-w-sm space-y-4">
        <p className="text-xl text-gray-600 font-medium leading-relaxed">
          Your simple guide to studying in Europe 🌍
        </p>
        <p className="text-gray-400 font-medium">
          Find schools, housing & support services
        </p>
      </div>

      {/* 5. Info Badges Row */}
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 mb-16 w-full max-w-md">
        <div className="badge">
          <span className="text-green-500 text-xl">🌐</span>
          <span>Lithuania (Others Soon!)</span>
        </div>
        <div className="badge">
          <span className="text-green-500 text-xl font-bold">💚</span>
          <span>Verified Options</span>
        </div>
      </div>

      {/* 6. Primary Action Button */}
      <div className="w-full max-w-sm px-4 mt-auto mb-10">
        <button 
          onClick={onStart}
          className="w-full py-5 rounded-3xl button-primary text-xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <span className="text-2xl">👉</span>
          Get Started
          <span className="text-2xl">→</span>
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen


