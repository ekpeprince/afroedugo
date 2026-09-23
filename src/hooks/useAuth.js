import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as updateAuthProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, collection, addDoc } from 'firebase/firestore';
import { logger } from '../utils/logger';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync secure server-side session cookie
        try {
          const idToken = await currentUser.getIdToken();
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
        } catch (syncErr) {
          logger.warn('Session sync warning:', syncErr.message);
        }
        // Legacy fallback cookie for local dev / client navigation
        document.cookie = "session-auth=true; path=/; max-age=1209600; SameSite=Lax";
      } else {
        // Destroy server-side session
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch {}
        document.cookie = "session-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncUserProfile(userCredential.user);
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
      
      // Automatically send verification email
      try {
        await sendEmailVerification(userCredential.user);
      } catch (verifErr) {
        logger.warn('Verification email dispatch warning:', verifErr.message);
      }

      await syncUserProfile(userCredential.user, options);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
      return true;
    }
    return false;
  };

  const syncUserProfile = async (user, options = {}) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const isNewUser = !userSnap.exists();
      
      const existingData = userSnap.data() || {};
      const finalDisplayName = existingData.displayName || user.displayName || user.email?.split('@')[0] || "Scholar";

      const existingPhoto = existingData.photoURL || existingData.photoUrl;
      const finalPhoto = existingPhoto || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalDisplayName)}&background=random`;

      const marketingOptIn = options.weeklyUpdates !== undefined 
        ? !!options.weeklyUpdates 
        : (existingData.emailPreferences?.marketing ?? existingData.weeklyUpdates ?? true);

      const profileData = {
        uid: user.uid,
        displayName: finalDisplayName,
        photoURL: finalPhoto,
        email: user.email,
        lastOnline: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        status: "online",
        emailPreferences: {
          marketing: marketingOptIn,
        },
        reEngagementSentAt: existingData.reEngagementSentAt !== undefined ? existingData.reEngagementSentAt : null,
        ...(isNewUser ? { joinedAt: serverTimestamp() } : {})
      };

      if (options.weeklyUpdates !== undefined) {
        profileData.weeklyUpdates = !!options.weeklyUpdates;
        if (options.weeklyUpdates) {
          profileData.weeklyUpdatesOptInAt = serverTimestamp();
        }
      }

      await setDoc(userRef, profileData, { merge: true });

      if (auth.currentUser) {
        try {
          const authUpdates = {};
          if (finalPhoto && auth.currentUser.photoURL !== finalPhoto) {
            authUpdates.photoURL = finalPhoto;
          }
          if (finalDisplayName && auth.currentUser.displayName !== finalDisplayName) {
            authUpdates.displayName = finalDisplayName;
          }
          if (Object.keys(authUpdates).length > 0) {
            await updateAuthProfile(auth.currentUser, authUpdates);
          }
        } catch (authSyncErr) {
          logger.warn("Could not sync Firebase Auth user profile:", authSyncErr.message);
        }
      }

      if (options.weeklyUpdates && user.email) {
        try {
          await setDoc(doc(db, 'newsletter_subscribers', user.uid), {
            email: user.email,
            displayName: finalDisplayName,
            subscribedAt: serverTimestamp(),
            source: 'weekly_updates_opt_in'
          }, { merge: true });
        } catch (subErr) {
          logger.error("Newsletter subscriber sync error:", subErr.message);
        }
      }

      if (isNewUser) {
        await addDoc(collection(db, 'discussions'), {
          text: `👋 Please welcome our newest member, ${finalDisplayName}! Say hi and make them feel at home.`,
          user: "🤖 Welcome Bot",
          userId: "system_bot",
          category: "General",
          createdAt: serverTimestamp(),
          likes: [],
          commentCount: 0
        });
      }
    } catch (err) {
      logger.error("Profile sync error:", err.message);
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
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || "YOUR_CLIENT_KEY";
    const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || window.location.origin;
    const scope = 'user.info.basic';
    const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${Math.random().toString(36).substring(7)}`;
    window.location.href = authUrl;
  };

  const logout = async () => {
    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid), { status: 'offline', lastOnline: serverTimestamp() }, { merge: true });
      }
      await signOut(auth);
      await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
      document.cookie = "session-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    } catch (error) {
      logger.error("Logout error:", error.message);
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

  return { 
    user, 
    loading, 
    error, 
    login, 
    signup, 
    logout, 
    loginWithGoogle, 
    loginWithTikTok, 
    resetPassword,
    resendVerificationEmail
  };
};
