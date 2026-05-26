import { useState, useEffect } from 'react'
import { db } from '../firebase/config'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { useAuth } from './useAuth'

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(docs);
      setUnreadCount(docs.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const clearNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      const promises = unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
      await Promise.all(promises);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, clearNotification, markAllAsRead };
};
