import React, { useState, useEffect } from 'react';
import SmartImage from './SmartImage';
import CommentSection from './CommentSection';
import PostText from './PostText';

const PostImageViewer = ({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  post,
  onLogin,
  onToggleReaction,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showComments, setShowComments] = useState(false);

  // Sync initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      // Automatically show comments on desktop, hide on mobile to focus on image
      setShowComments(window.innerWidth >= 1024);
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialIndex]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || !post) return null;

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Check if current user reacted to anything (for highlighting the heart icon generally)
  const hasReacted = currentUserId && (
    post.likes?.includes(currentUserId) || 
    Object.values(post.reactions || {}).some(uids => uids.includes(currentUserId))
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Close button - absolute top right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 lg:right-auto lg:left-4 z-50 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
        title="Close"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* ── LEFT/TOP AREA: Image Carousel ── */}
      <div 
        className="flex-grow relative flex items-center justify-center min-h-[50vh] lg:min-h-screen"
        onClick={onClose}
      >
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 lg:left-8 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors z-20"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Current Image */}
        <div 
          className="w-full h-full p-2 lg:p-8 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1} of ${images.length}`}
            className="max-w-full max-h-[85vh] lg:max-h-full object-contain select-none"
            loading="lazy"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 lg:right-8 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors z-20"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        {/* Pagination Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>
        )}

        {/* Mobile Toggle Comments Button */}
        <div className="absolute bottom-4 right-4 lg:hidden z-20">
          <button
            onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
            className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {post.commentCount || 0}
          </button>
        </div>
      </div>

      {/* ── RIGHT/BOTTOM AREA: Sidebar (Post Info & Comments) ── */}
      <div 
        className={`bg-white dark:bg-gray-900 w-full lg:w-[400px] xl:w-[450px] shrink-0 flex flex-col transition-all duration-300 ease-in-out ${
          showComments ? 'h-[50vh] lg:h-full translate-y-0' : 'h-0 lg:h-full translate-y-full lg:translate-y-0 overflow-hidden'
        }`}
      >
        <div className="flex-grow overflow-y-auto no-scrollbar p-5 pb-24">
          {/* Post Author Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-600">
              {post.userPhotoURL ? (
                <img src={post.userPhotoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                '👤'
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white leading-tight">
                {post.user}
              </p>
              <p className="text-gray-400 text-xs">
                {post.userRole === 'current' ? '🎓 Current Student' : '✈️ Incoming'}
              </p>
            </div>
          </div>

          {/* Post Text */}
          <div className="mb-4 text-sm text-gray-800 dark:text-gray-200 font-medium">
            <PostText text={post.text} />
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-6 py-3 border-y border-gray-100 dark:border-gray-800 mb-2">
            <div className="relative group">
              <button
                className={`flex items-center gap-2 font-bold transition-colors ${
                  hasReacted ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={hasReacted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="flex items-center gap-1">
                  {Object.values(post.reactions || {}).reduce((sum, arr) => sum + arr.length, 0) + (post.likes?.length || 0)}
                  <span className="flex -space-x-1 ml-1 text-xs">
                    {(post.likes?.length > 0 ? ['❤️'] : []).concat(Object.keys(post.reactions || {})).slice(0, 3).map((e, i) => (
                      <span key={i} className="bg-white dark:bg-gray-800 rounded-full">{e}</span>
                    ))}
                  </span>
                </span>
              </button>
              
              {/* Hoverable Emoji Picker */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl rounded-full p-2 gap-2 animate-in slide-in-from-bottom-2 duration-200 z-10">
                {['👍', '🤣', '❤️', '😮', '🙏'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleReaction(post.id, post.reactions || {}, post.userId, post.text, emoji);
                    }}
                    className={`text-xl hover:scale-125 transition-transform ${post.reactions?.[emoji]?.includes(currentUserId) ? 'bg-indigo-500/20 rounded-full' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 font-bold text-gray-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {post.commentCount || 0}
            </div>
          </div>

          {/* Comment Section Component */}
          <CommentSection
            postId={post.id}
            postAuthorId={post.userId}
            postTitle={(post.text || '').slice(0, 30) + '...'}
            onLogin={onLogin}
          />
        </div>
      </div>
    </div>
  );
};

export default PostImageViewer;
