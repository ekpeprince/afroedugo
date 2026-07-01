import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  setDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp, 
  getDocs,
  limit,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import { notifyUser } from '../utils/notifyUser';

export const useChat = (conversationId = null) => {
  const { user } = useAuth();
  const [rawConversations, setRawConversations] = useState([]);
  const [participantProfiles, setParticipantProfiles] = useState({});
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
      setRawConversations(convs);
      setLoading(false);
    }, (err) => {
      console.error("Error loading conversations:", err);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  // Subscribe to participant profiles in real-time
  useEffect(() => {
    if (!user || rawConversations.length === 0) return;

    const otherUids = [
      ...new Set(
        rawConversations
          .map(c => c.participants?.find(uid => uid !== user.uid))
          .filter(Boolean)
      )
    ];

    const unsubscribes = otherUids.map(uid => {
      return onSnapshot(doc(db, 'users', uid), (snap) => {
        if (snap.exists()) {
          setParticipantProfiles(prev => ({
            ...prev,
            [uid]: { ...snap.data(), uid: snap.id }
          }));
        }
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [rawConversations, user?.uid]);

  // Merge raw conversations with real-time participant profiles
  const conversations = useMemo(() => {
    return rawConversations.map(conv => {
      const otherUid = conv.participants?.find(uid => uid !== user.uid);
      if (!otherUid) return conv;

      const profile = participantProfiles[otherUid];
      return {
        ...conv,
        participantId: otherUid,
        participantName: profile?.displayName || conv.participantName || otherUid.slice(0, 6),
        participantAvatar: profile?.photoURL || profile?.photoUrl || conv.participantAvatar || '👤',
        participantStatus: profile?.status || 'offline',
        participantLastOnline: profile?.lastOnline || null
      };
    });
  }, [rawConversations, participantProfiles, user?.uid]);


  // Subscribe to messages in a specific conversation
  useEffect(() => {
    if (!conversationId) return;

    // Clear unread flag on parent conversation for current user
    const clearUnreadStatus = async () => {
      try {
        await updateDoc(doc(db, 'conversations', conversationId), {
          unreadBy: arrayRemove(user.uid, 'admin_support')
        });
      } catch (e) {
        // Silently catch in case document hasn't fully propagated yet
      }
    };
    clearUnreadStatus();

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
  }, [conversationId, user]);

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

      // Update parent conversation's last message, timestamp, and unread status
      const convRef = doc(db, 'conversations', convId);
      
      let recipientId = null;
      try {
        const convSnap = await getDoc(convRef);
        const participants = convSnap.data()?.participants || [];
        recipientId = participants.find(id => id !== user.uid);
      } catch (_) {}

      await setDoc(convRef, {
        lastMessage: imageUrl ? '📷 Image' : text,
        updatedAt: serverTimestamp(),
        unreadBy: recipientId ? arrayUnion(recipientId) : []
      }, { merge: true });

      // Push notification to the other participant
      if (recipientId) {
        try {
          // Get sender's display name
          const senderSnap = await getDoc(doc(db, 'users', user.uid));
          const senderData = senderSnap.data();
          const senderName = senderData?.displayName || user.displayName || user.email?.split('@')[0] || 'Someone';
          const senderPhotoURL = senderData?.photoURL || senderData?.photoUrl || user.photoURL || null;
          const preview = imageUrl ? '📷 Sent a photo' : text.slice(0, 60);

          // 1. Create a Firestore notification document so it displays in the Feed!
          await addDoc(collection(db, 'notifications'), {
            userId: recipientId,
            senderId: user.uid,
            senderName,
            senderPhotoURL,
            conversationId: convId,
            title: `✉️ New Message!`,
            message: `sent you a message: "${preview}"`,
            type: 'chat',
            link: 'chat',
            read: false,
            createdAt: serverTimestamp()
          });

          // 2. Trigger push notification
          notifyUser(recipientId, `💬 ${senderName}`, preview);

          // 3. If recipient is the expert, trigger the email notification API
          if (recipientId === 'admin_support') {
            try {
              fetch('/api/notify-expert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  senderName,
                  senderEmail: user.email,
                  messagePreview: preview,
                  conversationId: convId
                })
              }).catch(e => console.error("Expert email trigger failed:", e));
            } catch (err) { /* non-critical */ }
          }
        } catch (_) { /* non-critical */ }
      }

    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const getOrCreateConversation = async (participantId, metadata = {}) => {
    if (!user) return null;

    const chatType = metadata.type || 'direct';

    // Check for existing direct chat between these two with the same type
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      where('type', '==', chatType)
    );

    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(doc => doc.data().participants.includes(participantId));

    if (existing) {
      return existing.id;
    }

    // Create new conversation
    const newConv = await addDoc(collection(db, 'conversations'), {
      participants: [user.uid, participantId],
      type: chatType,
      lastMessage: '',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      ...metadata
    });

    return newConv.id;
  };

  const unreadDMsCount = useMemo(() => {
    if (!user) return 0;
    return conversations.filter(c => c.unreadBy?.includes(user.uid)).length;
  }, [conversations, user]);

  return { 
    conversations, 
    messages, 
    loading, 
    sendMessage, 
    getOrCreateConversation,
    unreadDMsCount
  };
};
