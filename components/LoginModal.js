'use client';

import { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function LoginModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, signup } = useAuthStore();

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await signup(email, password, name);
        alert("Verification email sent! Please check your inbox.");
        setIsSignUp(false);
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#1c1c1e] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <span className="text-lg font-black tracking-tight text-white">{isSignUp ? 'Join SunGeet' : 'Sign In'}</span>
          <button onClick={onClose} className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all"><X size={20} /></button>
        </div>

        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                {error}
              </div>
            )}

            {isSignUp && (
              <div className="relative group">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#fa2d48] transition-colors" />
                <input 
                  type="text" required placeholder="Display Name" value={name} onChange={e => setName(e.target.value)} 
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 text-sm text-white border border-white/5 outline-none focus:border-[#fa2d48] transition-all placeholder:text-white/20" 
                />
              </div>
            )}

            <div className="relative group">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#fa2d48] transition-colors" />
              <input 
                type="email" required placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} 
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 text-sm text-white border border-white/5 outline-none focus:border-[#fa2d48] transition-all placeholder:text-white/20" 
              />
            </div>

            <div className="relative group">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#fa2d48] transition-colors" />
              <input 
                type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} 
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 text-sm text-white border border-white/5 outline-none focus:border-[#fa2d48] transition-all placeholder:text-white/20" 
              />
            </div>

            <button 
              type="submit" disabled={isLoading} 
              className="w-full py-4 rounded-xl bg-[#fa2d48] text-white text-sm font-black tracking-widest uppercase hover:bg-[#fa2d48]/90 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-bold text-white/40">
            {isSignUp ? 'MEMBER ALREADY?' : "NEW TO SUNGEET?"}{' '}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="text-[#fa2d48] hover:underline uppercase selection:bg-none outline-none">
              {isSignUp ? 'Sign In' : 'Sign Up Now'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
