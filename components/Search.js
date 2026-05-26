'use client';

import { useState } from 'react';
import { Search as SearchIcon, Play, Pause, Loader2, Plus, Check } from 'lucide-react';
import useStore from '../store/useStore';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { setCurrentSong, currentSong, isPlaying, setIsPlaying, addToPlaylist, playlist } = useStore();

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
    <div className="px-8 pb-32 animate-fade-in bg-black min-h-screen text-white">
      {/* Search Title */}
      <div className="pt-12 mb-10">
         <h1 className="text-[44px] font-black tracking-tight leading-none mb-8">Search</h1>
         <form onSubmit={handleSearch} className="relative group max-w-2xl">
            <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-[#1c1c1e] border border-white/5 rounded-xl text-lg text-white placeholder:text-white/20 focus:outline-none focus:bg-[#2c2c2e] transition-all"
              placeholder="Artists, Songs, Lyrics, and More"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHasSearched(false);
              }}
            />
         </form>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <div className="w-8 h-8 border-2 border-white/10 border-t-[#fa2d48] rounded-full animate-spin" />
           <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Searching SunGeet...</p>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="py-20 text-center animate-fade-in opacity-40">
           <h3 className="text-xl font-bold mb-2">No results for "{query}"</h3>
           <p className="text-sm">Check the spelling or try a different search term.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4">
            {results.map((song) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div 
                  key={song.id} 
                  className="flex items-center gap-4 group cursor-pointer py-1.5 border-b border-white/5"
                  onClick={() => playSong(song)}
                >
                  <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                    <img src={song.thumbnail} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={16} fill="white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className={`text-sm font-bold truncate leading-tight ${isCurrent ? 'text-[#fa2d48]' : 'text-white'}`}>{song.title}</h3>
                    <p className="text-xs font-semibold text-white/40 truncate mt-1">{song.author}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories / Genre Grid with Pictures */}
      {!hasSearched && !loading && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold mb-6">Browse Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {[
              { name: 'Pop', img: 'https://images.unsplash.com/photo-1514525253361-bee8a48790c3?w=400&q=80', color: '#fa2d48' },
              { name: 'Hip-Hop', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55d2d?w=400&q=80', color: '#af52de' },
              { name: 'Dance', img: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&q=80', color: '#ff9500' },
              { name: 'Rock', img: 'https://images.unsplash.com/photo-1498019559366-a1cbd07b5160?w=400&q=80', color: '#fdbb2d' },
              { name: 'Chill', img: 'https://images.unsplash.com/photo-1445985551627-2c99a6cd880c?w=400&q=80', color: '#30d158' },
              { name: 'Electronic', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80', color: '#5856d6' },
            ].map((cat) => (
              <div 
                key={cat.name} 
                className="relative aspect-[16/10] rounded-xl overflow-hidden cursor-pointer group shadow-lg"
              >
                <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div 
                  className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity" 
                  style={{ backgroundColor: cat.color }} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <span className="text-lg font-black tracking-tight text-white z-10">{cat.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

