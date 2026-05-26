import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const syncUserProfile = async (user) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || "Scholar",
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || "Scholar"}&background=random`,
        email: user.email,
        lastOnline: serverTimestamp(),
        status: "online",
        joinedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Profile sync error:", err);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(result.user);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithTikTok = () => {
    // 1. TikTok Client Key from .env
    const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY || "YOUR_CLIENT_KEY";
    const redirectUri = import.meta.env.VITE_TIKTOK_REDIRECT_URI || window.location.origin;
    
    // 2. Generate authorization URL
    // Scope: user.info.basic
    const scope = 'user.info.basic';
    const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${Math.random().toString(36).substring(7)}`;

    // 3. Redirect User
    window.location.href = authUrl;
  };

  const logout = async () => {
    try {
      if (user) {
        // Mark as offline in Firestore
        await setDoc(doc(db, 'users', user.uid), { status: 'offline', lastOnline: serverTimestamp() }, { merge: true });
      }
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  return { user, loading, error, login, signup, logout, loginWithGoogle, loginWithTikTok };
};
