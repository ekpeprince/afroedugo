import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase/config';
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, 
  serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { notifyUser } from '../utils/notifyUser';

const CommentSection = ({ postId, postAuthorId, postTitle, onLogin }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, userName, text, userId }
  
  const inputRef = useRef(null);

  // Subscribe to comments for this post
  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  // Group and sort comments hierarchically
  const topLevelComments = useMemo(() => {
    return comments.filter(c => !c.parentId);
  }, [comments]);

  const repliesByParent = useMemo(() => {
    const map = {};
    comments.forEach(c => {
      if (c.parentId) {
        if (!map[c.parentId]) map[c.parentId] = [];
        map[c.parentId].push(c);
      }
    });
    return map;
  }, [comments]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const commentData = {
        postId,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || user.email.split('@')[0],
        userPhotoURL: profile?.photoURL || user?.photoURL || null,
        text: newComment,
        likes: [],
        parentId: replyingTo ? replyingTo.commentId : null,
        createdAt: serverTimestamp(),
      };

      // 1. Add the comment/reply
      await addDoc(collection(db, 'comments'), commentData);

      // Update the comment count on the discussion post
      await updateDoc(doc(db, 'discussions', postId), {
        commentCount: increment(1)
      });

      // 2. Notifications logic
      const senderName = profile?.displayName || user.displayName || user.email.split('@')[0];
      
      if (replyingTo) {
        // Notify the author of the comment we replied to
        if (replyingTo.userId !== user.uid) {
          const preview = newComment.slice(0, 45);
          await addDoc(collection(db, 'notifications'), {
            userId: replyingTo.userId,
            title: '💬 New Reply to Comment!',
            message: `${senderName} replied to your comment: "${preview}..."`,
            type: 'reply',
            link: 'community',
            read: false,
            createdAt: serverTimestamp()
          });
          notifyUser(replyingTo.userId, '💬 New Reply!', `${senderName} replied to your comment: "${preview}"`);
        }
      } else if (postAuthorId && postAuthorId !== user.uid) {
        // Top-level comment: Notify the post author
        await addDoc(collection(db, 'notifications'), {
          userId: postAuthorId,
          title: '💬 New Reply!',
          message: `${senderName} replied to your post: "${postTitle}"`,
          type: 'reply',
          link: 'community',
          read: false,
          createdAt: serverTimestamp()
        });
        notifyUser(postAuthorId, '💬 New Reply!', `${senderName} replied: "${postTitle}"`);
      }

      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleToggleCommentLike = async (commentId, likes = []) => {
    if (!user) {
      onLogin?.();
      return;
    }
    const isLiked = likes?.includes(user.uid);
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (err) {
      console.error("Error toggling comment like:", err);
    }
  };

  const startReply = (comment) => {
    if (!user) {
      onLogin?.();
      return;
    }
    setReplyingTo({
      commentId: comment.id,
      userName: comment.userName,
      text: comment.text,
      userId: comment.userId
    });
    // Focus the input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Helper to render a comment item
  const renderComment = (comment, isReply = false) => {
    const isLiked = user && comment.likes?.includes(user.uid);
    
    return (
      <div key={comment.id} className={`flex gap-3 ${isReply ? 'mt-3 pl-8 relative before:absolute before:left-3 before:top-0 before:bottom-4 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700 before:content-[""] after:absolute after:left-3 after:top-4 after:w-4 after:h-0.5 after:bg-gray-200 dark:after:bg-gray-700 after:content-[""]' : ''}`}>
        {/* Avatar */}
        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-xs border border-gray-200 dark:border-gray-650 shadow-sm shrink-0">
          {comment.userPhotoURL ? (
            <img src={comment.userPhotoURL} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            '👤'
          )}
        </div>

        {/* Content Box */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 rounded-[1.25rem] rounded-tl-md border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-black text-gray-900 dark:text-white text-xs">{comment.userName}</span>
              <span className="text-[9px] text-gray-400 font-bold">
                {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
              </span>
            </div>
            <p className="text-gray-800 dark:text-gray-200 text-sm font-medium leading-relaxed break-words">{comment.text}</p>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-4 mt-1.5 ml-2">
            {/* Like Comment */}
            <button 
              onClick={() => handleToggleCommentLike(comment.id, comment.likes)}
              className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <span>{isLiked ? '❤️' : '🤍'}</span>
              <span>{comment.likes?.length || 0}</span>
            </button>

            {/* Reply Button (Only on top-level comments to prevent infinite nesting levels) */}
            {!isReply && (
              <button 
                onClick={() => startReply(comment)}
                className="text-[10px] font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-0.5"
              >
                <span>💬</span> Reply
              </button>
            )}
          </div>

          {/* Nested Replies */}
          {!isReply && repliesByParent[comment.id] && (
            <div className="space-y-1.5">
              {repliesByParent[comment.id].map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      
      {/* Comments List */}
      <div className="space-y-5 max-h-96 overflow-y-auto no-scrollbar pr-2">
        {loading ? (
          <div className="py-4 text-center">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin inline-block"></div>
          </div>
        ) : topLevelComments.length === 0 ? (
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center py-4">
            No replies yet. Start the conversation!
          </p>
        ) : (
          topLevelComments.map(comment => renderComment(comment))
        )}
      </div>

      {/* Replying Indicator Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 text-xs font-bold text-primary animate-in slide-in-from-bottom-2 duration-200">
          <span>Replying to @{replyingTo.userName}</span>
          <button 
            type="button" 
            onClick={() => setReplyingTo(null)}
            className="hover:scale-115 transition-transform"
          >
            ✕
          </button>
        </div>
      )}

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSendComment} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:border-primary/40 focus-within:ring-4 ring-primary/10 transition-all shadow-sm">
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-xs border border-gray-200 dark:border-gray-650 shrink-0 ml-1">
            {profile?.photoURL || user?.photoURL ? (
              <img src={profile?.photoURL || user?.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.email[0].toUpperCase()
            )}
          </div>
          <input 
            type="text"
            ref={inputRef}
            placeholder={replyingTo ? `Write a reply to @${replyingTo.userName}...` : "Write a reply..."}
            className="flex-grow bg-transparent px-2 py-2 text-sm font-medium text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!newComment.trim()}
            className="bg-primary text-white p-3 rounded-xl shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={onLogin}
          className="text-xs text-primary hover:text-primary-600 font-bold text-center w-full hover:underline transition-all cursor-pointer py-2"
        >
          Log in to join the conversation
        </button>
      )}
    </div>
  );
};

export default CommentSection;
