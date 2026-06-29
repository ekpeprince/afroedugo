import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  setDoc,
  doc,
  getDoc,
  serverTimestamp, 
  getDocs,
  limit
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import { notifyUser } from '../utils/notifyUser';

export const useChat = (conversationId = null) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to all conversations for the current user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(convs);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  // Subscribe to messages in a specific conversation
  useEffect(() => {
    if (!conversationId) return;

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      
      // Auto-mark as read if they are from the other person and unread
      msgs.forEach(async (m) => {
        if (m.senderId !== user.uid && !m.read) {
          try {
            await setDoc(doc(db, 'conversations', conversationId, 'messages', m.id), {
              read: true
            }, { merge: true });
          } catch(e) {}
        }
      });
    });

    return unsub;
  }, [conversationId]);

  const sendMessage = async (convId, text, imageUrl = null) => {
    if (!user || (!text.trim() && !imageUrl)) return;

    try {
      const messagesRef = collection(db, 'conversations', convId, 'messages');
      await addDoc(messagesRef, {
        text,
        imageUrl,
        senderId: user.uid,
        read: false,
        createdAt: serverTimestamp()
      });

      // Update parent conversation's last message and timestamp
      const convRef = doc(db, 'conversations', convId);
      await setDoc(convRef, {
        lastMessage: imageUrl ? '📷 Image' : text,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Push notification to the other participant
      try {
        const convSnap = await getDoc(convRef);
        const participants = convSnap.data()?.participants || [];
        const recipientId = participants.find(id => id !== user.uid);
        if (recipientId) {
          // Get sender's display name
          const senderSnap = await getDoc(doc(db, 'users', user.uid));
          const senderName = senderSnap.data()?.displayName || user.displayName || user.email?.split('@')[0] || 'Someone';
          const preview = imageUrl ? '📷 Sent a photo' : text.slice(0, 60);
          notifyUser(recipientId, `💬 ${senderName}`, preview);
        }
      } catch (_) { /* non-critical */ }

    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const getOrCreateConversation = async (participantId, metadata = {}) => {
    if (!user) return null;

    // Check for existing direct chat between these two
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      where('type', '==', 'direct')
    );

    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(doc => doc.data().participants.includes(participantId));

    if (existing) {
      return existing.id;
    }

    // Create new conversation
    const newConv = await addDoc(collection(db, 'conversations'), {
      participants: [user.uid, participantId],
      type: 'direct',
      lastMessage: '',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      ...metadata
    });

    return newConv.id;
  };

  return { 
    conversations, 
    messages, 
    loading, 
    sendMessage, 
    getOrCreateConversation 
  };
};
