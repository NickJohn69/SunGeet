'use client';

import { useState } from 'react';
import { Search as SearchIcon, Play, Pause, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { setCurrentSong, currentSong, isPlaying, setIsPlaying } = useStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
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
    }
  };

  return (
    <div className="px-6 pt-4 pb-6">
      <form onSubmit={handleSearch}>
        <div className="relative max-w-md">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-white text-black rounded-full text-sm placeholder:text-[#727272] focus:outline-none focus:ring-2 focus:ring-[#1db954]"
            placeholder="Search songs..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHasSearched(false);
            }}
          />
        </div>
      </form>

      {loading && <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#1db954]" size={20} /></div>}

      {!loading && hasSearched && results.length === 0 && (
        <div className="py-12 text-center text-sm text-[#b3b3b3]">No results found</div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div key={song.id} className="group bg-[#181818] hover:bg-[#282828] rounded p-3 transition-colors cursor-pointer">
                  <div className="relative aspect-square rounded mb-2 shadow-lg">
                    <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover rounded" />
                    <button
                      onClick={() => playSong(song)}
                      className="absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center bg-[#1db954] rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                    >
                      {isCurrent && isPlaying ? <Pause size={14} fill="black" className="text-black" /> : <Play size={14} fill="black" className="text-black ml-0.5" />}
                    </button>
                  </div>
                  <h3 className="text-xs font-medium truncate text-white">{song.title}</h3>
                  <p className="text-[10px] text-[#b3b3b3] truncate">{song.author}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
