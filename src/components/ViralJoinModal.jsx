import React, { useEffect, useState } from 'react';

const ViralJoinModal = ({ isOpen, onClose, userName }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShare = async () => {
    const shareData = {
      title: 'Join me on AfroEduGo!',
      text: `Hey! I just joined AfroEduGo. It's helping me find schools and housing in the Baltics. Check it out here: ${window.location.origin}`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        onClose();
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text}`);
        alert('Invitation link copied to clipboard! Share it with your friends.');
        onClose();
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-all duration-500 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className={`relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500 transform ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-12'}`}>
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-xl border-4 border-white">
          <span className="text-4xl text-white">🇪🇺</span>
        </div>

        <div className="mt-12 text-center space-y-4">
          <h2 className="text-3xl font-black text-gray-900 leading-tight">
            Welcome to Europe, <br/> {userName || 'Scholar'}!
          </h2>
          <p className="text-gray-500 font-medium px-4">
            You're now part of the elite community finding the best education & housing in the Baltics.
          </p>
          
          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 my-8">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Want to bring your friends?</p>
            <p className="text-sm font-bold text-gray-700 italic">
              "Hey! I just joined AfroEduGo. It's helping me find schools..."
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleShare}
              className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <span>🚀 Invite My Friends</span>
            </button>
            
            <button 
              onClick={onClose}
              className="w-full bg-transparent text-gray-400 py-3 rounded-[2rem] font-bold text-sm hover:text-gray-600 transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViralJoinModal;
