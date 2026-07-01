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

  // Manage user presence status (online/offline)
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    // Set to online on mount/auth change
    setDoc(userRef, { status: 'online', lastOnline: serverTimestamp() }, { merge: true })
      .catch(err => console.error("Error setting presence to online:", err));

    const handlePresenceOffline = () => {
      setDoc(userRef, { status: 'offline', lastOnline: serverTimestamp() }, { merge: true })
        .catch(err => console.error("Error setting presence to offline on unload:", err));
    };

    window.addEventListener('beforeunload', handlePresenceOffline);
    
    return () => {
      window.removeEventListener('beforeunload', handlePresenceOffline);
      // Mark as offline when unmounting or changing user
      setDoc(userRef, { status: 'offline', lastOnline: serverTimestamp() }, { merge: true })
        .catch(err => console.error("Error setting presence to offline on cleanup:", err));
    };
  }, [user]);


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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await syncUserProfile(userCredential.user);
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
      const userSnap = await getDoc(userRef);
      const isNewUser = !userSnap.exists();
      
      const displayName = user.displayName || user.email?.split('@')[0] || "Scholar";

      await setDoc(userRef, {
        uid: user.uid,
        displayName: displayName,
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`,
        email: user.email,
        lastOnline: serverTimestamp(),
        status: "online",
        ...(isNewUser ? { joinedAt: serverTimestamp() } : {})
      }, { merge: true });

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
