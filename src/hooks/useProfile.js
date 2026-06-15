import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data());
      } else {
        // Create initial profile if it doesn't exist
        const initialProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.email.split('@')[0],
          bio: '',
          country: '',
          major: '',
          role: 'incoming',
          photoUrl: '',
          createdAt: new Date()
        };
        setDoc(doc.ref, initialProfile);
        setProfile(initialProfile);
      }
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const updateProfile = async (data) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, data);
  };

  return { profile, loading, updateProfile };
};
