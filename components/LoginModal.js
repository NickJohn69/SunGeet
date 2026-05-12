'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function LoginModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(res => setTimeout(res, 500));
    login(isSignUp ? name : email.split('@')[0]);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#181818] border border-[#282828] rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#282828]">
          <span className="text-sm font-bold text-white">{isSignUp ? 'Create account' : 'Sign in'}</span>
          <button onClick={onClose} className="p-1 rounded text-[#b3b3b3] hover:text-white"><X size={16} /></button>
        </div>

        <div className="p-6">
          <form onSubmit={handleAuth} className="space-y-3">
            {isSignUp && (
              <input type="text" required placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded bg-[#121212] text-sm text-white border border-[#282828] outline-none focus:border-[#1db954]" />
            )}
            <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded bg-[#121212] text-sm text-white border border-[#282828] outline-none focus:border-[#1db954]" />
            <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded bg-[#121212] text-sm text-white border border-[#282828] outline-none focus:border-[#1db954]" />
            <button type="submit" disabled={isLoading} className="w-full py-3 rounded-full bg-[#1db954] text-black text-sm font-bold hover:bg-[#1ed760] transition-colors">
              {isLoading ? 'Loading...' : (isSignUp ? 'Create account' : 'Sign in')}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#b3b3b3]">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-white hover:underline">{isSignUp ? 'Sign in' : 'Sign up'}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
