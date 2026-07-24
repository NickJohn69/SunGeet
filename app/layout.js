'use client';

import { useEffect, useRef } from 'react';
import Navigation from '../components/Navigation';
import Player from '../components/Player';
import Sidebar from '../components/Sidebar';
import Lyrics from '../components/Lyrics';
import ActivityTracker from '../components/ActivityTracker';
import useAuthStore from '../store/authStore';
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({ children }) {
  const { initialize } = useAuthStore();
  const keepaliveRef = useRef(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Register service worker + keepalive for background playback
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});

      // Send periodic keepalive to keep the SW alive
      keepaliveRef.current = setInterval(() => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage('keepalive');
        }
      }, 20000);
    }

    return () => {
      if (keepaliveRef.current) clearInterval(keepaliveRef.current);
    };
  }, []);

  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <title>SunGeet : Geet Suna Moj Gara</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#18181b" />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ClerkProvider>
          <div className="fixed top-4 right-4 z-[100] flex items-center gap-3 bg-white/5 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-2xl">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="px-5 py-2 rounded-full bg-[#fa2d48] text-white text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-5 py-2 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all">Sign Up</button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-10 h-10' } }} />
            </Show>
          </div>

          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
              <Navigation />
              {children}
            </div>
          </div>
          <Player />
          <Lyrics />
          <ActivityTracker />
        </ClerkProvider>
      </body>
    </html>
  );
}
