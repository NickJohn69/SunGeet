'use client';

import { useState, useEffect } from 'react';
import { Search as SearchIcon, User, Play, ChevronRight, Music, Loader2 } from 'lucide-react';
import useStore from '../../store/useStore';
import { getTopArtists } from '../../store/useStore';

export default function ArtistsPage() {
  const [query, setQuery] = useState('');
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistSongs, setArtistSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  
  const { setCurrentSong, setPlaylist, currentSong, isPlaying, setIsPlaying } = useStore();

  const topArtists = getTopArtists(10);

  const searchArtists = async (artistName) => {
    setLoading(true);
    setSelectedArtist(null);
    try {
      // Use the new artist search type to get real artist profile pictures
      const res = await fetch(`/api/search?q=${encodeURIComponent(artistName)}&type=artist`);
      const data = await res.json();
      setArtists(data);
    } catch (err) {
      console.error('Artist search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const [topArtistsData, setTopArtistsData] = useState([]);
  
  useEffect(() => {
    if (topArtists.length > 0) {
      const fetchTopArtistsPics = async () => {
        try {
          const results = await Promise.all(
            topArtists.map(name => 
              fetch(`/api/search?q=${encodeURIComponent(name)}&type=artist`)
                .then(res => res.json())
                .then(data => data[0] || { name, thumbnail: null })
                .catch(() => ({ name, thumbnail: null }))
            )
          );
          setTopArtistsData(results);
        } catch (err) {
          console.error('Top artists fetch failed:', err);
        }
      };
      fetchTopArtistsPics();
    }
  }, [topArtists.join(',')]);

  const fetchArtistSongs = async (artist) => {
    const name = typeof artist === 'string' ? artist : artist.name;
    const pic = typeof artist === 'string' ? null : artist.thumbnail;
    
    setLoadingSongs(true);
    setSelectedArtist({ name, thumbnail: pic });
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(name + " songs")}`);
      const data = await res.json();
      setArtistSongs(data);
    } catch (err) {
      console.error('Songs fetch failed:', err);
    } finally {
      setLoadingSongs(false);
    }
  };

  const playArtistSongs = (song, allSongs) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setPlaylist(allSongs);
      setCurrentSong(song);
      if (typeof window !== 'undefined' && window._sunGeetDirectPlay) {
        window._sunGeetDirectPlay(song.id);
      }
    }
  };

  return (
    <div className="px-8 pb-32 animate-fade-in bg-black min-h-screen text-white">
      <div className="pt-12 mb-10 flex items-center justify-between">
         <h1 className="text-[44px] font-black tracking-tight leading-none">Artists</h1>
         {selectedArtist && (
           <button 
             onClick={() => setSelectedArtist(null)}
             className="text-xs font-black uppercase tracking-widest text-[#fa2d48] px-4 py-2 bg-white/5 rounded-full hover:bg-white/10 transition-all"
           >
             Back to Search
           </button>
         )}
      </div>

      {!selectedArtist ? (
        <div className="animate-fade-in">
          <form 
            onSubmit={(e) => { e.preventDefault(); searchArtists(query); }}
            className="relative group max-w-2xl mb-12"
          >
            <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-[#1c1c1e] border border-white/5 rounded-xl text-lg text-white placeholder:text-white/20 focus:outline-none focus:bg-[#2c2c2e] transition-all"
              placeholder="Search for an artist..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 size={32} className="text-[#fa2d48] animate-spin" />
               <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Searching Artists...</p>
             </div>
          ) : artists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {artists.map((artist) => (
                <div 
                  key={artist.id}
                  onClick={() => fetchArtistSongs(artist)}
                  className="group cursor-pointer text-center"
                >
                  <div className="relative aspect-square rounded-full overflow-hidden mb-4 shadow-xl border-4 border-transparent group-hover:border-[#fa2d48]/30 transition-all duration-500">
                    <img src={artist.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <User size={32} className="text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold truncate group-hover:text-[#fa2d48] transition-colors">{artist.name}</h3>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">{artist.subscribers}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-fade-in">
               <h2 className="text-xl font-bold mb-6 text-white/40 uppercase tracking-widest text-xs">Recently Listened Artists</h2>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                 {topArtistsData.length > 0 ? topArtistsData.map((artist) => (
                   <div 
                     key={artist.name}
                     onClick={() => fetchArtistSongs(artist)}
                     className="group cursor-pointer text-center"
                   >
                     <div className="relative aspect-square rounded-full overflow-hidden mb-4 shadow-xl border-4 border-transparent group-hover:border-[#fa2d48]/30 transition-all duration-500">
                        {artist.thumbnail ? (
                           <img src={artist.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                           <div className="w-full h-full bg-white/5 flex items-center justify-center group-hover:bg-[#fa2d48]/10 transition-all">
                              <User size={40} className="text-white/10 group-hover:text-[#fa2d48] transition-colors" />
                           </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Play size={32} fill="white" className="text-white ml-2" />
                        </div>
                     </div>
                     <h3 className="font-bold truncate group-hover:text-[#fa2d48] transition-colors">{artist.name}</h3>
                   </div>
                 )) : (
                   <div className="col-span-full py-12 text-center text-white/20">
                      <p>Pick a song to see your top artists here.</p>
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
           <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-[#fa2d48] to-[#ff453a] flex items-center justify-center shadow-2xl shadow-[#fa2d48]/20 overflow-hidden">
                 {selectedArtist.thumbnail ? (
                    <img src={selectedArtist.thumbnail} className="w-full h-full object-cover" />
                 ) : (
                    <User size={64} className="text-white" />
                 )}
              </div>
              <div className="text-center md:text-left">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fa2d48] mb-2">Artist Profile</p>
                 <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">{selectedArtist.name}</h2>
                 <p className="text-white/40 font-bold">{artistSongs.length} Songs on SunGeet</p>
              </div>
           </div>

           {loadingSongs ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 size={32} className="text-[#fa2d48] animate-spin" />
               <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Fetching Discography...</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-4">
                {artistSongs.map((song) => {
                  const isCurrent = currentSong?.id === song.id;
                  return (
                    <div 
                      key={song.id} 
                      className="flex items-center gap-4 group cursor-pointer py-2 border-b border-white/5 hover:bg-white/5 px-2 rounded-lg transition-colors"
                      onClick={() => playArtistSongs(song, artistSongs)}
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
           )}
        </div>
      )}
    </div>
  );
}
