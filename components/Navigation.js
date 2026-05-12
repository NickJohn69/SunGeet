'use client';

import { Music, Moon, Sun, Download, Library as LibraryIcon, LogIn, LogOut, DownloadCloud } from 'lucide-react';
import useStore from '../store/useStore';
import useAuthStore from '../store/authStore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoginModal from './LoginModal';

export default function Navigation() {
  const { theme, toggleTheme } = useStore();
  const { user, login, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.log('Service Worker registration failed: ', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [theme]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleLoginClick = () => {
    setIsLoginOpen(true);
  };

  return (
    <nav className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
            <Music size={22} className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            SunGeet
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          {mounted && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-3 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <DownloadCloud size={18} />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}
          
          {mounted && user && (
            <Link href="/library" className="flex items-center gap-2 px-3 h-10 rounded-full bg-muted/50 text-foreground hover:bg-muted transition-colors text-sm font-medium">
              <LibraryIcon size={18} className="text-primary" />
              <span className="hidden sm:inline">Library</span>
            </Link>
          )}

          {mounted && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground hidden md:inline">Hi, {user.username}</span>
                  <button onClick={logout} className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Logout">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button onClick={handleLoginClick} className="flex items-center gap-2 px-4 h-10 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium">
                  <LogIn size={18} />
                  <span>Login</span>
                </button>
              )}
              
              <button
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </>
          )}
        </div>
      </div>
      
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </nav>
  );
}
