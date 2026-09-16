import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, collection, addDoc } from 'firebase/firestore';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        document.cookie = "session-auth=true; path=/; max-age=31536000; SameSite=Lax";
      } else {
        document.cookie = "session-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Presence tracking has been moved to ClientWrapper.jsx to prevent race conditions


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

  const signup = async (email, password, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await syncUserProfile(userCredential.user, options);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const syncUserProfile = async (user, options = {}) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const isNewUser = !userSnap.exists();
      
      const displayName = user.displayName || user.email?.split('@')[0] || "Scholar";

      const profileData = {
        uid: user.uid,
        displayName: displayName,
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`,
        email: user.email,
        lastOnline: serverTimestamp(),
        status: "online",
        ...(isNewUser ? { joinedAt: serverTimestamp() } : {})
      };

      if (options.weeklyUpdates !== undefined) {
        profileData.weeklyUpdates = !!options.weeklyUpdates;
        if (options.weeklyUpdates) {
          profileData.weeklyUpdatesOptInAt = serverTimestamp();
        }
      }

      await setDoc(userRef, profileData, { merge: true });

      if (options.weeklyUpdates && user.email) {
        try {
          await setDoc(doc(db, 'newsletter_subscribers', user.uid), {
            email: user.email,
            displayName: displayName,
            subscribedAt: serverTimestamp(),
            source: 'weekly_updates_opt_in'
          }, { merge: true });
        } catch (subErr) {
          console.error("Newsletter subscriber sync error:", subErr);
        }
      }

      if (isNewUser) {
        // Welcome Bot Post
        await addDoc(collection(db, 'discussions'), {
          text: `👋 Please welcome our newest member, ${displayName}! Say hi and make them feel at home.`,
          user: "🤖 Welcome Bot",
          userId: "system_bot",
          category: "General",
          createdAt: serverTimestamp(),
          likes: [],
          commentCount: 0
        });
      }
    } catch (err) {
      console.error("Profile sync error:", err);
    }
  };

  const loginWithGoogle = async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(result.user, options);
      return result.user;
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'afroedugo.com';
        msg = `Domain "${domain}" is not authorized in Firebase Console. Please add "${domain}" under Firebase > Authentication > Settings > Authorized domains.`;
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = null;
      }
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithTikTok = () => {
    // 1. TikTok Client Key from .env
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || "YOUR_CLIENT_KEY";
    const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || window.location.origin;
    
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
  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, login, signup, logout, loginWithGoogle, loginWithTikTok, resetPassword };
};
