import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
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

    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const photoURL = data.photoURL || data.photoUrl || user.photoURL || '';
          setProfile({ ...data, photoURL });
        } else {
          // Create initial profile if it doesn't exist
          const initialProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            bio: '',
            country: '',
            major: '',
            role: 'incoming',
            photoURL: user.photoURL || '',
            createdAt: new Date()
          };
          setDoc(docSnap.ref, initialProfile, { merge: true });
          setProfile(initialProfile);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error loading user profile:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const updateProfile = async (data) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    // Security: Never permit client-side modification of privileged roles or verification status
    const { role, isVerified, joinedAt, uid, email, ...safeData } = data || {};
    await setDoc(userRef, safeData, { merge: true });

    // Sync with Firebase Auth currentUser so auth state stays in lockstep
    if (auth.currentUser) {
      try {
        const authUpdates = {};
        if (data.displayName) authUpdates.displayName = data.displayName;
        if (data.photoURL) authUpdates.photoURL = data.photoURL;
        if (Object.keys(authUpdates).length > 0) {
          await updateAuthProfile(auth.currentUser, authUpdates);
        }
      } catch (authErr) {
        console.warn("Could not sync with auth profile:", authErr);
      }
    }

    // Optimistically update local profile state
    setProfile(prev => ({ ...(prev || {}), ...data }));
  };

  return { profile, loading, updateProfile };
};
