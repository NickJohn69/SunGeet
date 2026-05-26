'use client';

import { useEffect } from 'react';
import Navigation from '../components/Navigation';
import Player from '../components/Player';
import Sidebar from '../components/Sidebar';
import Lyrics from '../components/Lyrics';
import useAuthStore from '../store/authStore';
import "./globals.css";

export default function RootLayout({ children }) {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <title>SunGeet : Geet Suna Moj Gara</title>
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
      </body>
    </html>
  );
}
