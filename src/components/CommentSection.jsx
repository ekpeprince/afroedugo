import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';

const CommentSection = ({ postId, postAuthorId, postTitle, onLogin }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
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
        userPhotoURL: profile?.photoURL || null,
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
    <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Comments List */}
      <div className="space-y-5 max-h-80 overflow-y-auto no-scrollbar pr-2">
        {loading ? (
          <div className="py-4 text-center">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin inline-block"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center py-4">No replies yet. Start the conversation!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center text-xs border border-gray-200 shadow-sm shrink-0">
                {comment.userPhotoURL ? (
                  <img src={comment.userPhotoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-gray-900 text-xs">{comment.userName}</span>
                  <span className="text-[9px] text-gray-400 font-bold">
                    {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                  </span>
                </div>
                <div className="bg-gray-50 px-4 py-3 rounded-[1.5rem] rounded-tl-md border border-gray-100 shadow-sm inline-block max-w-full">
                  <p className="text-gray-800 text-sm font-medium leading-relaxed">{comment.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSendComment} className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 focus-within:border-primary/40 focus-within:ring-4 ring-primary/10 transition-all shadow-sm">
          <div className="w-8 h-8 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center text-xs border border-gray-200 shrink-0 ml-1">
            {profile?.photoURL || user?.photoURL ? (
              <img src={profile?.photoURL || user?.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.email[0].toUpperCase()
            )}
          </div>
          <input 
            type="text"
            placeholder="Write a reply..."
            className="flex-grow bg-transparent px-2 py-2 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!newComment.trim()}
            className="bg-primary text-white p-3 rounded-xl shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
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
