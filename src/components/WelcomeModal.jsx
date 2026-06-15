import React from 'react';

const WelcomeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleShare = async () => {
    const shareData = {
      title: 'Join me on AfroEduGo',
      text: "Yo! I just started my journey to Europe on AfroEduGo. Join me and let's find a school together!",
      url: 'https://afroedugo-b0b3f.web.app/'
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for desktop: Copy to clipboard or open WhatsApp
        const inviteUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
        window.open(inviteUrl, '_blank');
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/75 backdrop-blur-md pointer-events-auto animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 text-center">
        {/* Background Accent */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="text-6xl mb-6 scale-110 hover:rotate-12 transition-transform duration-500 cursor-default">🌍</div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2 leading-none">Welcome to the Community!</h2>
          <p className="text-gray-400 font-bold text-sm mb-8 leading-relaxed">
            Your journey to Europe just became real. Want to bring your friends along?
          </p>

          <div className="space-y-3">
            <button 
              onClick={handleShare}
              className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              🚀 Invite Your Friends
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-gray-600 transition-colors"
            >
              I'll do it later
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-center gap-4 grayscale opacity-50">
             <div className="flex flex-col items-center">
                <span className="text-[8px] font-black uppercase tracking-widest mb-1">Share on</span>
                <div className="flex gap-2">
                   <span className="text-xl">💬</span>
                   <span className="text-xl">🎵</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
