import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const AuthScreen = ({ onBack, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup, loading, error, loginWithGoogle } = useAuth();
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      onAuthSuccess?.();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-8">
      <header className="mb-12">
        <button onClick={onBack} className="text-2xl mb-8 hover:text-primary transition-colors">←</button>
        <h1 className="text-4xl font-black tracking-tight mb-2">
          {isLogin ? 'Welcome Back!' : 'Start Your Journey'}
        </h1>
        <p className="text-gray-400 font-medium">
          {isLogin 
            ? 'Login to access your shortlisted schools and housing.' 
            : 'Join the AfroEduGo community and save your favorites.'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 flex-grow">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email Address</label>
          <input 
            type="email"
            placeholder="name@example.com"
            className="w-full bg-gray-50 py-5 px-6 rounded-[2rem] border border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Password</label>
          <input 
            type="password"
            placeholder="••••••••"
            className="w-full bg-gray-50 py-5 px-6 rounded-[2rem] border border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-bold text-gray-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {(error || localError) && (
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <p className="text-red-500 text-xs font-bold text-center">
              {localError || error}
            </p>
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
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

        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-[1px] bg-gray-100"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">OR CONTINUE WITH</span>
          <div className="flex-1 h-[1px] bg-gray-100"></div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            type="button"
            onClick={async () => {
              try {
                await loginWithGoogle();
                onAuthSuccess?.();
              } catch (err) {
                setLocalError(err.message);
              }
            }}
            className="flex items-center justify-center gap-3 bg-white py-5 px-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100 hover:bg-gray-50 active:scale-95 transition-all group w-full"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-black text-xs uppercase tracking-widest text-gray-700">Continue with Google</span>
          </button>
        </div>
      </form>

      <footer className="mt-auto py-8 text-center">
        <p className="text-gray-400 font-bold mb-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
        </p>
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary font-black uppercase tracking-widest text-sm hover:underline"
        >
          {isLogin ? 'Sign Up Instead' : 'Login Instead'}
        </button>
      </footer>
    </div>
  )
}

export default AuthScreen
