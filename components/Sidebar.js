'use client';

import { useState, useEffect } from 'react';
import { Home, Search, Library as LibraryIcon, PlusSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useStore from '../store/useStore';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { user } = useAuthStore();
  const { addToPlaylist, setCurrentSong } = useStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setCollapsed(saved === 'true');
  }, []);

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const localSong = {
        id: `local-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        author: "Local File",
        thumbnail: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&q=80",
        duration: "Unknown",
        localUrl: url
      };
      addToPlaylist(localSong);
      setCurrentSong(localSong);
    }
    e.target.value = '';
  };

  return (
    <aside className={`bg-black flex flex-col h-full transition-all duration-300 ${collapsed ? 'w-12' : 'w-56'}`}>
      <div className="p-3 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 text-white">
            <div className="w-7 h-7 bg-[#1db954] rounded flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <span className="text-sm font-bold">SunGeet</span>
          </div>
        )}
        <button onClick={toggleCollapse} className="p-1 rounded text-[#b3b3b3] hover:text-white transition-colors">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="px-2 space-y-1">
        <button className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${pathname === '/' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}>
          <Home size={18} />
          {!collapsed && <span>Home</span>}
        </button>
      </nav>

      {!collapsed && (
        <div className="px-2 mt-3 border-t border-[#282828] pt-3">
          <span className="text-xs font-bold text-[#b3b3b3] uppercase px-3">Library</span>
        </div>
      )}

      {mounted && (
        <div className={`mt-1 ${collapsed ? 'px-1' : 'px-3'}`}>
          <label className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-[#b3b3b3] hover:text-white cursor-pointer transition-colors ${collapsed ? 'justify-center' : ''}`}>
            <PlusSquare size={18} />
            {!collapsed && <span>Add song</span>}
            <input type="file" accept="audio/mp3,audio/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="text-xs text-[#b3b3b3] px-3">Import songs to build your library</p>
        </div>
      )}
    </aside>
  );
}
