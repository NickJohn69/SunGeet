'use client';

import { useState, useEffect, useRef } from 'react';
import { Home, Search, Music, Radio, ListMusic, PlusSquare, User, LogOut, Sparkles, ShieldCheck, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
import PremiumModal from './PremiumModal';
import useAuthStore from '../store/authStore';
import useStore from '../store/useStore';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Sidebar() {
  const { user, logout, isSuperAdmin, userPlan } = useAuthStore();
  const { addToPlaylist, setCurrentSong, isSidebarOpen, setSidebarOpen } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { 
    setMounted(true);
    // On mobile, close sidebar by default
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      const localUrl = URL.createObjectURL(file);
      const song = {
        id: `local-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        author: "Local File",
        thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
        localUrl: localUrl
      };
      addToPlaylist(song);
      setCurrentSong(song);
    }
  };

  const navItems = [
    { name: 'Home', icon: Home, href: '/' },
    { name: 'New', icon: Music, href: '/new' },
    { name: 'Radio', icon: Radio, href: '/radio' },
    { name: 'Playlists', icon: ListMusic, href: '/playlists' },
    { name: 'Plans', icon: Crown, href: '/plans' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

    <aside 
      className={`
        fixed inset-y-0 left-0 z-[101] bg-black border-r border-white/5 flex flex-col h-screen py-6
        transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'w-64 px-4 translate-x-0 opacity-100' : 'w-0 lg:w-20 px-0 lg:px-3 -translate-x-full lg:translate-x-0 lg:opacity-100 opacity-0 pointer-events-none lg:pointer-events-auto'}
      `}
    >
      {/* Dynamic Collapse Button (Desktop Only) */}
      {mounted && isSidebarOpen !== undefined && (
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-[#fa2d48] rounded-full items-center justify-center text-white shadow-lg hover:scale-110 transition-all z-[110]"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      )}

      {/* Logo Section */}
      <div className={`flex items-center gap-3 px-3 mb-12 group cursor-pointer pt-2 overflow-hidden ${!isSidebarOpen && 'lg:justify-center lg:px-0'}`}>
        <div className="w-10 h-10 bg-gradient-to-tr from-[#fa2d48] to-[#ff453a] rounded-[12px] flex-shrink-0 flex items-center justify-center shadow-lg shadow-[#fa2d48]/20 group-hover:scale-110 transition-all duration-500">
           <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white">
              <path d="M12 4V14C12 15.6569 10.6569 17 9 17C7.34315 17 6 15.6569 6 14C6 12.3431 7.34315 11 9 11C9.64807 11 10.2471 11.2057 10.7371 11.556" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 7L18 5V15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
           </svg>
        </div>
        {isSidebarOpen && <span className="text-[22px] font-black tracking-tighter text-white uppercase italic animate-in fade-in slide-in-from-left-2 duration-500">SunGeet</span>}
      </div>

      {/* Nav Area */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isSidebarOpen ? item.name : ""}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-[#fa2d48] bg-white/5' : 'text-white/30 hover:text-white hover:bg-white/5'} ${!isSidebarOpen && 'lg:justify-center lg:px-0'}`}
            >
              <item.icon size={22} className={`flex-shrink-0 ${isActive ? 'text-[#fa2d48]' : 'text-white/20'}`} />
              {isSidebarOpen && <span className="truncate animate-in fade-in slide-in-from-left-2 duration-500">{item.name}</span>}
            </Link>
          );
        })}

        {/* Upgrade / Admin section */}
        <div className={`mt-8 space-y-4 ${!isSidebarOpen && 'lg:hidden'}`}>
          {mounted && user && !isSuperAdmin() && userPlan === 'free' && (
            <button 
              onClick={() => setIsPremiumOpen(true)}
              className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#fa2d48]/30 transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-[#fa2d48] mb-1">Go Premium</p>
              <p className="text-[11px] font-bold text-white/40">Unlock all features.</p>
            </button>
          )}

          {mounted && isSuperAdmin() && (
            <Link 
              href="/admin"
              className="block p-4 rounded-2xl bg-[#fa2d48]/5 border border-[#fa2d48]/20 hover:border-[#fa2d48] transition-all"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-[#fa2d48] mb-1">Admin Panel</p>
              <p className="text-[11px] font-bold text-white/40">Manage SunGeet</p>
            </Link>
          )}
        </div>
      </nav>

      {/* Footer Area */}
      <div className={`mt-auto pt-6 border-t border-white/5 space-y-2 overflow-hidden ${!isSidebarOpen && 'lg:items-center'}`}>
        <input type="file" ref={fileInputRef} onChange={handleFileImport} accept="audio/*" className="hidden" />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          title="Import Locally"
          className={`w-full flex items-center gap-3 px-4 py-3 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm font-bold group ${!isSidebarOpen && 'lg:justify-center lg:px-0'}`}
        >
          <PlusSquare size={22} className="flex-shrink-0 group-hover:text-[#fa2d48] transition-colors" />
          {isSidebarOpen && <span className="truncate">Import Locally</span>}
        </button>

        {mounted && user && (
          <button 
            onClick={logout} 
            title="Sign Out"
            className={`w-full flex items-center gap-3 px-4 py-3 text-white/30 hover:text-[#fa2d48] hover:bg-white/5 rounded-xl transition-all text-sm font-bold group ${!isSidebarOpen && 'lg:justify-center lg:px-0'}`}
          >
            <LogOut size={22} className="flex-shrink-0 group-hover:text-[#fa2d48] transition-colors" />
            {isSidebarOpen && <span className="truncate">Sign Out</span>}
          </button>
        )}
      </div>
    </aside>
      <PremiumModal isOpen={isPremiumOpen} onClose={() => setIsPremiumOpen(false)} />
    </>
  );
}
