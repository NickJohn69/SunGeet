'use client';

import { useState } from 'react';
import { Search as SearchIcon, Play, Plus, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { setCurrentSong, addToPlaylist } = useStore();

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

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <form onSubmit={handleSearch} className="relative mb-8 max-w-2xl mx-auto">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <SearchIcon size={20} />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 rounded-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all outline-none text-lg shadow-sm"
            placeholder="Search for songs, artists, or podcasts..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHasSearched(false);
            }}
          />
          <button 
            type="submit" 
            className="absolute right-2 top-2 bottom-2 bg-primary text-primary-foreground px-6 rounded-full font-medium hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex justify-center items-center py-20 text-muted-foreground gap-3">
          <Loader2 className="animate-spin" size={24} />
          <span>Searching Music...</span>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="flex justify-center items-center py-20 text-muted-foreground">
          <span>No results found.</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold px-2">Top Tracks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map((song) => (
              <div 
                key={song.id} 
                className="group relative bg-card border border-border hover:border-primary/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={song.thumbnail} 
                    alt={song.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button 
                      onClick={() => setCurrentSong(song)}
                      className="w-12 h-12 flex items-center justify-center rounded-full hover:scale-110 transition-transform shadow-lg border border-white/30"
                      style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
                      title="Play"
                    >
                      <Play size={22} fill="white" stroke="white" className="ml-0.5" />
                    </button>
                    <button 
                      onClick={() => addToPlaylist(song)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:scale-110 transition-all border border-white/20"
                      style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
                      title="Add to Queue"
                    >
                      <Plus size={20} stroke="white" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium backdrop-blur-sm">
                    {song.duration}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">{song.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{song.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
