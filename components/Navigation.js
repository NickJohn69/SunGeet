'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import { Search as SearchIcon, Play, Pause, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';
import LoginModal from './LoginModal';

export default function Navigation() {
  const { user } = useAuthStore();
  const { setCurrentSong, currentSong, isPlaying, setIsPlaying } = useStore();
  const [mounted, setMounted] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setMounted(true);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const playSong = (song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setShowResults(false);
      setQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#121212] px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-1.5 bg-white text-black rounded-full text-sm placeholder:text-[#727272] focus:outline-none focus:ring-2 focus:ring-[#1db954]"
              placeholder="Search songs..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(false);
              }}
            />
          </form>

          {mounted && !user && (
            <button onClick={() => setIsLoginOpen(true)} className="px-3 py-1 bg-white text-black text-xs font-bold rounded-full hover:scale-105 transition-transform">
              Sign in
            </button>
          )}
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-[#282828] border border-[#282828] rounded-lg mt-2 max-h-80 overflow-y-auto shadow-xl">
            {results.slice(0, 8).map((song) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <button
                  key={song.id}
                  onClick={() => playSong(song)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#3e3e3e] transition-colors text-left"
                >
                  <img src={song.thumbnail} alt={song.title} className="w-8 h-8 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs truncate ${isCurrent ? 'text-[#1db954]' : 'text-white'}`}>{song.title}</p>
                    <p className="text-[10px] text-[#b3b3b3] truncate">{song.author}</p>
                  </div>
                  {isCurrent && isPlaying && <Play size={12} fill="#1db954" className="text-[#1db954]" />}
                </button>
              );
            })}
          </div>
        )}
      </header>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
