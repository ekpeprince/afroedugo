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
  serverTimestamp, 
  getDocs,
  limit
} from 'firebase/firestore';
import { useAuth } from './useAuth';

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
    });

    return unsub;
  }, [conversationId]);

  const sendMessage = async (convId, text) => {
    if (!user || !text.trim()) return;

    try {
      const messagesRef = collection(db, 'conversations', convId, 'messages');
      await addDoc(messagesRef, {
        text,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });

      // Update parent conversation's last message and timestamp
      const convRef = doc(db, 'conversations', convId);
      await setDoc(convRef, {
        lastMessage: text,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      console.error("Error sending message:", err);
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
