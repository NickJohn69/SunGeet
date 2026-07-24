'use client';

import { useEffect, useRef } from 'react';
import Navigation from '../components/Navigation';
import Player from '../components/Player';
import Sidebar from '../components/Sidebar';
import Lyrics from '../components/Lyrics';
import ActivityTracker from '../components/ActivityTracker';
import useAuthStore from '../store/authStore';
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
      </body>
    </html>
  );
}

