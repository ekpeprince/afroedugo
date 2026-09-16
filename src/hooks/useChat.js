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
  arrayRemove,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import { notifyUser } from '../utils/notifyUser';
import { isUserOnline } from '../utils/presence';

export const useChat = (conversationId = null) => {
  const { user } = useAuth();
  const [rawConversations, setRawConversations] = useState([]);
  const [participantProfiles, setParticipantProfiles] = useState({});
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [presenceTicker, setPresenceTicker] = useState(0);

  // Periodic ticker to refresh presence status (online/offline) in conversation list
  useEffect(() => {
    const interval = setInterval(() => {
      setPresenceTicker(t => t + 1);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

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
          .map(c => c.participants?.find(uid => uid !== user?.uid))
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
      }, (err) => {
        console.warn('Participant profile sync error:', err);
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [rawConversations, user?.uid]);

  // Merge raw conversations with real-time participant profiles
  const conversations = useMemo(() => {
    return rawConversations.map(conv => {
      const otherUid = conv.participants?.find(uid => uid !== user?.uid);
      if (!otherUid) return conv;

      const profile = participantProfiles[otherUid];
      return {
        ...conv,
        participantId: otherUid,
        participantName: profile?.displayName || conv.participantName || otherUid.slice(0, 6),
        participantAvatar: profile?.photoURL || profile?.photoUrl || conv.participantAvatar || '👤',
        participantStatus: isUserOnline(profile?.status, profile?.lastOnline) ? 'online' : 'offline',
        participantLastOnline: profile?.lastOnline || null
      };
    });
  }, [rawConversations, participantProfiles, user?.uid, presenceTicker]);

  // Subscribe to messages in a specific conversation
  useEffect(() => {
    if (!conversationId || !user) return;

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
      
      // Auto-mark as read in a single atomic batch if incoming messages are unread
      const unreadIncoming = msgs.filter(m => m.senderId !== user.uid && !m.read);
      if (unreadIncoming.length > 0) {
        try {
          const batch = writeBatch(db);
          unreadIncoming.forEach((m) => {
            batch.update(doc(db, 'conversations', conversationId, 'messages', m.id), {
              read: true
            });
          });
          batch.commit().catch(err => console.warn('Batch mark read error:', err));
        } catch(e) {}
        clearUnreadStatus();
      }
    }, (err) => {
      console.warn("Messages subscription error:", err);
    });

    return unsub;
  }, [conversationId, user]);

  const sendMessage = async (convId, text, imageUrl = null, audioUrl = null, replyTo = null, audioDuration = null) => {
    const trimmedText = text ? text.trim() : '';
    if (!user || (!trimmedText && !imageUrl && !audioUrl)) return;

    try {
      const messagesRef = collection(db, 'conversations', convId, 'messages');
      const msgData = {
        text: trimmedText || null,
        imageUrl: imageUrl || null,
        audioUrl: audioUrl || null,
        audioDuration: audioDuration || null,
        senderId: user.uid,
        read: false,
        createdAt: serverTimestamp()
      };
      
      if (replyTo) {
        msgData.replyToMessageId = replyTo.id;
        msgData.replyToText = replyTo.text || (replyTo.audioUrl ? '🎤 Voice Message' : (replyTo.imageUrl ? '📷 Image' : ''));
        msgData.replyToSenderId = replyTo.senderId;
      }

      await addDoc(messagesRef, msgData);

      // Update parent conversation's last message, timestamp, and unread status
      const convRef = doc(db, 'conversations', convId);
      
      let recipientId = null;
      // Fast check in existing in-memory conversations
      const existingConv = rawConversations.find(c => c.id === convId);
      if (existingConv?.participants) {
        recipientId = existingConv.participants.find(id => id !== user.uid);
      }
      if (!recipientId) {
        try {
          const convSnap = await getDoc(convRef);
          const participants = convSnap.data()?.participants || [];
          recipientId = participants.find(id => id !== user.uid);
        } catch (_) {}
      }

      const updatePayload = {
        lastMessage: audioUrl ? '🎤 Voice Message' : (imageUrl ? '📷 Image' : trimmedText),
        updatedAt: serverTimestamp()
      };
      if (recipientId) {
        updatePayload.unreadBy = arrayUnion(recipientId);
      }

      await setDoc(convRef, updatePayload, { merge: true });

      // Push notification to the other participant
      if (recipientId) {
        try {
          // Get sender's display name
          const senderSnap = await getDoc(doc(db, 'users', user.uid));
          const senderData = senderSnap.data();
          const senderName = senderData?.displayName || user.displayName || user.email?.split('@')[0] || 'Someone';
          const senderPhotoURL = senderData?.photoURL || senderData?.photoUrl || user.photoURL || null;
          const preview = audioUrl ? '🎤 Sent a voice message' : (imageUrl ? '📷 Sent a photo' : trimmedText.slice(0, 60));

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
            link: `chat?convId=${convId}`,
            read: false,
            createdAt: serverTimestamp()
          });

          // 2. Trigger push notification with sender's avatar, optional image attachment, and grouping tag
          notifyUser(recipientId, `💬 ${senderName}`, preview, `chat?convId=${convId}`, senderPhotoURL, imageUrl, `chat-${convId}`);

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

  const deleteMessage = async (convId, msgId) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'conversations', convId, 'messages', msgId), {
        deleted: true,
        text: null,
        imageUrl: null,
        audioUrl: null,
        audioDuration: null,
        replyToMessageId: null
      });

      // If the deleted message was the lastMessage, soften it
      try {
        const convRef = doc(db, 'conversations', convId);
        const convSnap = await getDoc(convRef);
        if (convSnap.exists()) {
          const cData = convSnap.data();
          const targetMsg = messages.find(m => m.id === msgId);
          if (targetMsg && (cData.lastMessage === targetMsg.text || cData.lastMessage === '🎤 Voice Message' || cData.lastMessage === '📷 Image')) {
            await updateDoc(convRef, { lastMessage: '🚫 Message deleted' });
          }
        }
      } catch (_) {}
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const editMessage = async (convId, msgId, newText) => {
    const trimmed = newText ? newText.trim() : '';
    if (!user || !trimmed) return;
    try {
      await updateDoc(doc(db, 'conversations', convId, 'messages', msgId), {
        text: trimmed,
        isEdited: true
      });

      // Update parent conversation lastMessage if this was the last message
      try {
        const convRef = doc(db, 'conversations', convId);
        const convSnap = await getDoc(convRef);
        if (convSnap.exists()) {
          const oldMsg = messages.find(m => m.id === msgId);
          if (oldMsg && convSnap.data()?.lastMessage === oldMsg.text) {
            await updateDoc(convRef, { lastMessage: trimmed });
          }
        }
      } catch (_) {}
    } catch (err) {
      console.error('Error editing message:', err);
    }
  };

  const deleteConversation = async (convId) => {
    if (!user) return;
    // Confirm before deleting
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await deleteDoc(doc(db, 'conversations', convId));
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const setTypingStatus = async (convId, isTyping) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'conversations', convId), {
        typing: {
          [user.uid]: isTyping
        }
      }, { merge: true });
    } catch (err) {}
  };

  const getOrCreateConversation = async (participantId, metadata = {}) => {
    if (!user) return null;

    const chatType = metadata.type || 'direct';

    // 1. Check in-memory state first for instant response
    const existingInState = rawConversations.find(c => 
      c.participants?.includes(user.uid) && 
      c.participants?.includes(participantId) &&
      (!chatType || c.type === chatType)
    );
    if (existingInState) return existingInState.id;

    // 2. Query Firestore without multi-field composite index constraint
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(d => {
      const data = d.data();
      return data.participants?.includes(participantId) && (!chatType || data.type === chatType);
    });

    if (existing) {
      return existing.id;
    }

    // 3. Create new conversation
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
    editMessage, 
    deleteMessage, 
    deleteConversation, 
    setTypingStatus, 
    getOrCreateConversation, 
    unreadDMsCount 
  };
};
