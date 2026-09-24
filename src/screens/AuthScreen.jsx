import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { isValidEmail, validatePasswordStrength } from '../utils/validators'
import { logger } from '../utils/logger'

const AuthScreen = ({ onBack, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [weeklyUpdates, setWeeklyUpdates] = useState(false);
  const { login, signup, loading, error, loginWithGoogle, resetPassword } = useAuth();
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLocalSuccess('');
    const trimmedEmail = email.trim().toLowerCase();
    
    // Validate email format
    if (!isValidEmail(trimmedEmail)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    // Validate password strength on sign-up
    if (!isLogin) {
      const pwdCheck = validatePasswordStrength(password);
      if (!pwdCheck.valid) {
        setLocalError(pwdCheck.errors.join('. '));
        return;
      }
    }

    try {
      if (isLogin) {
        await login(trimmedEmail, password);
      } else {
        await signup(trimmedEmail, password, { weeklyUpdates });
        setLocalSuccess('Account created! A verification link was sent to your email. Please check your inbox.');
      }
      onAuthSuccess?.();
    } catch (err) {
      logger.warn('Authentication failure:', err.code || err.message);
      if (err.code === 'auth/invalid-credential') {
        setLocalError('Invalid email or password. If you signed up with Google, please click "Continue with Google" below.');
      } else if (err.code === 'auth/email-already-in-use') {
        setLocalError('An account already exists with this email.');
      } else if (err.code === 'auth/weak-password') {
        setLocalError('Password should be at least 8 characters with letters, numbers, and special symbols.');
      } else {
        setLocalError(err.message.replace('Firebase: ', ''));
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    setLocalSuccess('');
    try {
      await loginWithGoogle({ weeklyUpdates });
      onAuthSuccess?.();
    } catch (err) {
      logger.warn('Google sign-in exception:', err.code || err.message);
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'afroedugo.com';
      if (err.code === 'auth/unauthorized-domain') {
        setLocalError(`Domain "${domain}" is not authorized for Google Sign-In in Firebase Console. Please add "${domain}" to Firebase Authentication > Settings > Authorized domains.`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily closed the popup, no error needed
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Popup request cancelled
      } else if (err.code === 'auth/popup-blocked') {
        setLocalError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (err.code === 'auth/internal-error') {
        setLocalError(`Google sign-in error (auth/internal-error). Please verify "${domain}" is added to Authorized Domains in Firebase Console.`);
      } else {
        setLocalError(err.message ? err.message.replace('Firebase: ', '') : 'Google sign in failed.');
      }
    }
  };

  const handleForgotPassword = async () => {
    setLocalError('');
    setLocalSuccess('');
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      setLocalError('Please enter your email address first.');
      return;
    }
    
    try {
      await resetPassword(trimmedEmail);
      setLocalSuccess('Password reset email sent! Please check your Spam or Junk folder if you do not see it in your Inbox.');
    } catch (err) {
      logger.warn('Password reset exception:', err.code || err.message);
      if (err.code === 'auth/user-not-found') {
        setLocalError('No account found with this email.');
      } else {
        setLocalError(err.message.replace('Firebase: ', ''));
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b141a] text-gray-900 dark:text-white flex flex-col p-6 sm:p-8 transition-colors duration-300">
      <header className="mb-10">
        <button onClick={onBack} className="text-2xl mb-8 text-gray-800 dark:text-gray-200 hover:text-primary transition-colors flex items-center gap-2" aria-label="Go back">
          ←
        </button>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-gray-900 dark:text-white">
          {isLogin ? 'Welcome Back!' : 'Start Your Journey'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
          {isLogin 
            ? 'Login to access your shortlisted schools, chats, and housing.' 
            : 'Join the AfroEduGo community and connect with fellow scholars.'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 flex-grow max-w-md w-full mx-auto">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-400 ml-4">Email Address</label>
          <input 
            type="email"
            placeholder="name@example.com"
            className="w-full bg-gray-50 dark:bg-[#111b21] py-4 sm:py-5 px-6 rounded-[2rem] border border-gray-200 dark:border-gray-700/60 focus:border-primary dark:focus:border-primary focus:bg-white dark:focus:bg-[#182229] outline-none transition-all font-bold text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-400 ml-4">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full bg-gray-50 dark:bg-[#111b21] py-4 sm:py-5 pl-6 pr-14 rounded-[2rem] border border-gray-200 dark:border-gray-700/60 focus:border-primary dark:focus:border-primary focus:bg-white dark:focus:bg-[#182229] outline-none transition-all font-bold text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {isLogin && (
            <div className="text-right mt-1.5 mr-4">
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </div>

        {(error || localError) && (
          <div className="bg-red-50 dark:bg-red-950/40 p-4 rounded-2xl border border-red-100 dark:border-red-900/50 animate-in fade-in zoom-in-95">
            <p className="text-red-600 dark:text-red-400 text-xs font-bold text-center">
              {localError || error}
            </p>
          </div>
        )}

        {localSuccess && (
          <div className="bg-green-50 dark:bg-green-950/40 p-4 rounded-2xl border border-green-100 dark:border-green-900/50 animate-in fade-in zoom-in-95">
            <p className="text-green-600 dark:text-green-400 text-xs font-bold text-center">
              {localSuccess}
            </p>
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white py-5 rounded-[2rem] font-black text-base shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            isLogin ? 'Login Now' : 'Create Account'
          )}
        </button>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-800"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">OR CONTINUE WITH</span>
          <div className="flex-1 h-[1px] bg-gray-200 dark:bg-gray-800"></div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 bg-white dark:bg-[#111b21] py-4 sm:py-5 px-6 rounded-[2rem] border border-gray-200 dark:border-gray-700/60 shadow-md shadow-gray-100 dark:shadow-none hover:bg-gray-50 dark:hover:bg-[#182229] active:scale-98 transition-all group w-full cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-black text-xs uppercase tracking-widest text-gray-700 dark:text-gray-200">Continue with Google</span>
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-4">
          By continuing, you agree to AfroEduGo&apos;s{' '}
          <a href="/terms" className="text-gray-800 dark:text-gray-200 underline font-bold hover:text-primary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-gray-800 dark:text-gray-200 underline font-bold hover:text-primary">
            Privacy Policy
          </a>.
        </p>

        <label className="flex items-start gap-2.5 cursor-pointer select-none text-left px-2 pt-1">
          <input 
            type="checkbox"
            checked={weeklyUpdates}
            onChange={(e) => setWeeklyUpdates(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
          />
          <span className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 font-medium leading-tight">
            <span className="font-bold text-gray-500 dark:text-gray-400">(Optional)</span> Send me weekly updates on new student jobs, flats, and community posts.
          </span>
        </label>
      </form>

      <footer className="mt-auto py-8 text-center max-w-md w-full mx-auto">
        <p className="text-gray-500 dark:text-gray-400 font-bold mb-3 text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
        </p>
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary font-black uppercase tracking-widest text-sm hover:underline"
        >
          {isLogin ? 'Sign Up Instead' : 'Login Instead'}
        </button>

        <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-gray-400 dark:text-gray-500 font-bold">
          <a href="/privacy" className="hover:underline hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:underline hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</a>
        </div>
      </footer>
    </div>
  )
}

export default AuthScreen
