'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';
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
    
    // Simulate network delay
    await new Promise(res => setTimeout(res, 1000));
    
    // Here you would integrate Firebase or NextAuth.
    // For now, we mock the auth and log them in using local store.
    const username = isSignUp ? name : email.split('@')[0];
    login(username || 'User');
    setIsLoading(false);
    onClose();
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    // Simulate OAuth delay
    await new Promise(res => setTimeout(res, 1500));
    
    // Here you would implement real Google OAuth
    // (e.g. signIn('google') using NextAuth, or signInWithPopup via Firebase)
    login('Google User');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-md bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground bg-muted/50 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {isSignUp ? 'Create an account' : 'Welcome back'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isSignUp 
                  ? 'Enter your details to start listening.' 
                  : 'Log in to access your downloaded music.'}
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-foreground text-background py-3 rounded-xl font-medium hover:opacity-90 transition-opacity mb-6 disabled:opacity-70"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.81 15.69 17.61V20.35H19.26C21.35 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.26 20.35L15.69 17.61C14.71 18.27 13.46 18.69 12 18.69C9.18 18.69 6.78 16.78 5.89 14.24H2.21V17.09C4.01 20.67 7.71 23 12 23Z" fill="#34A853"/>
                <path d="M5.89 14.24C5.66 13.56 5.53 12.83 5.53 12.08C5.53 11.33 5.66 10.6 5.89 9.92V7.07H2.21C1.47 8.55 1.05 10.26 1.05 12.08C1.05 13.9 1.47 15.61 2.21 17.09L5.89 14.24Z" fill="#FBBC05"/>
                <path d="M12 5.47C13.62 5.47 15.07 6.03 16.21 7.12L19.34 3.99C17.46 2.24 14.97 1.16 12 1.16C7.71 1.16 4.01 3.49 2.21 7.07L5.89 9.92C6.78 7.38 9.18 5.47 12 5.47Z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-border/50 w-full"></div>
              <div className="absolute bg-card px-4 text-xs text-muted-foreground uppercase tracking-wider">
                or
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="Full Name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="Email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted/30 border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-muted/30 border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition-opacity mt-2 disabled:opacity-70 flex justify-center items-center h-[52px]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  isSignUp ? 'Sign Up' : 'Log In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isSignUp 
                  ? "Already have an account? Log in" 
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
