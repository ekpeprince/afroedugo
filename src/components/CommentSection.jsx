import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

const CommentSection = ({ postId, postAuthorId, postTitle }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

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

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      // 1. Add the comment
      await addDoc(collection(db, 'comments'), {
        postId,
        userId: user.uid,
        userName: user.email.split('@')[0],
        text: newComment,
        createdAt: serverTimestamp(),
      });

      // Update the comment count on the discussion post
      await updateDoc(doc(db, 'discussions', postId), {
        commentCount: increment(1)
      });

      // 2. Notify the author (if it's not the same person)
      if (postAuthorId && postAuthorId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: postAuthorId,
          title: '💬 New Reply!',
          message: `${user.email.split('@')[0]} replied to your post: "${postTitle}"`,
          type: 'reply',
          link: 'community',
          read: false,
          createdAt: serverTimestamp()
        });
      }

      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Comments List */}
      <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar pr-2">
        {loading ? (
          <div className="py-4 text-center">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin inline-block"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center py-2">No replies yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center text-[10px]">👤</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-black text-gray-900 text-[11px]">{comment.userName}</span>
                  <span className="text-[8px] text-gray-300 font-bold">
                    {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-50 shadow-sm inline-block max-w-full">
                  <p className="text-gray-600 text-xs font-medium leading-relaxed">{comment.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSendComment} className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-primary/20 transition-colors">
          <input 
            type="text"
            placeholder="Reply to this topic..."
            className="flex-grow bg-transparent px-3 py-1 text-xs font-bold text-gray-700 outline-none placeholder:text-gray-300"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!newComment.trim()}
            className="bg-primary text-white p-2 rounded-xl shadow-md shadow-primary/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </form>
      ) : (
        <p className="text-[10px] text-gray-400 font-bold text-center">Please login to reply.</p>
      )}
    </div>
  );
};

export default CommentSection;
