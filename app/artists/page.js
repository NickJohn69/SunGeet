'use client';

import { useState, useEffect } from 'react';
import { Search as SearchIcon, User, Play, Pause, ChevronRight, Music, Loader2, Disc3, Users, ExternalLink } from 'lucide-react';
import useStore from '../../store/useStore';
import { getTopArtists } from '../../store/useStore';

function formatFans(num) {
  if (!num) return '';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M fans`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K fans`;
  return `${num} fans`;
}

export default function ArtistsPage() {
  const [query, setQuery] = useState('');
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistSongs, setArtistSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  
  const { setCurrentSong, setPlaylist, currentSong, isPlaying, setIsPlaying } = useStore();

  const topArtists = getTopArtists(10);

  // ── Search Artists via Deezer ────────────────────────────────
  const searchArtists = async (artistName) => {
    setLoading(true);
    setSelectedArtist(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(artistName)}&type=artist`);
      const data = await res.json();
      setArtists(data);
    } catch (err) {
      console.error('Artist search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch top artists data with real Deezer photos ──────────
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

  // ── Fetch Artist Details + Top Tracks from Deezer ───────────
  const fetchArtistSongs = async (artist) => {
    const artistId = artist.id;
    const name = typeof artist === 'string' ? artist : artist.name;
    const pic = typeof artist === 'string' ? null : artist.thumbnail;
    
    setLoadingSongs(true);
    setSelectedArtist({ id: artistId, name, thumbnail: pic });
    
    try {
      if (artistId) {
        // Use dedicated artist endpoint for rich data
        const res = await fetch(`/api/artist?id=${artistId}`);
        const data = await res.json();
        
        if (data.artist) {
          setSelectedArtist({
            ...data.artist,
            thumbnail: data.artist.thumbnail || pic,
          });
        }
        setArtistSongs(data.tracks || []);
      } else {
        // Fallback: search by name
        const res = await fetch(`/api/search?q=${encodeURIComponent(name)}`);
        const data = await res.json();
        setArtistSongs(data);
      }
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

  const playAllSongs = () => {
    if (artistSongs.length > 0) {
      setPlaylist(artistSongs);
      setCurrentSong(artistSongs[0]);
      if (typeof window !== 'undefined' && window._sunGeetDirectPlay) {
        window._sunGeetDirectPlay(artistSongs[0].id);
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
                       <Play size={32} fill="white" className="text-white ml-1" />
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
           {/* Artist Hero Section */}
           <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-tr from-[#fa2d48] to-[#ff453a] flex items-center justify-center shadow-2xl shadow-[#fa2d48]/20 overflow-hidden flex-shrink-0">
                 {selectedArtist.thumbnail ? (
                    <img src={selectedArtist.thumbnail} className="w-full h-full object-cover" />
                 ) : (
                    <User size={64} className="text-white" />
                 )}
              </div>
              <div className="text-center md:text-left">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fa2d48] mb-2">Artist Profile</p>
                 <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">{selectedArtist.name}</h2>
                 
                 {/* Stats Row */}
                 <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start mb-6">
                    {selectedArtist.fans > 0 && (
                      <div className="flex items-center gap-2 text-white/50">
                        <Users size={16} />
                        <span className="text-sm font-bold">{formatFans(selectedArtist.fans)}</span>
                      </div>
                    )}
                    {selectedArtist.albums > 0 && (
                      <div className="flex items-center gap-2 text-white/50">
                        <Disc3 size={16} />
                        <span className="text-sm font-bold">{selectedArtist.albums} albums</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/50">
                      <Music size={16} />
                      <span className="text-sm font-bold">{artistSongs.length} tracks</span>
                    </div>
                    {selectedArtist.link && (
                      <a 
                        href={selectedArtist.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[#fa2d48] hover:text-[#ff453a] text-sm font-bold transition-colors"
                      >
                        <ExternalLink size={14} />
                        Deezer
                      </a>
                    )}
                 </div>

                 {/* Play All Button */}
                 {artistSongs.length > 0 && (
                   <button 
                     onClick={playAllSongs}
                     className="bg-[#fa2d48] hover:bg-[#ff453a] text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#fa2d48]/20"
                   >
                     <Play size={20} fill="white" /> Play All
                   </button>
                 )}
              </div>
           </div>

           {/* Track List */}
           {loadingSongs ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 size={32} className="text-[#fa2d48] animate-spin" />
               <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Fetching Discography...</p>
             </div>
           ) : (
             <>
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6">Popular Tracks</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-1">
                  {artistSongs.map((song, index) => {
                    const isCurrent = currentSong?.id === song.id;
                    const isCurrentPlaying = isCurrent && isPlaying;
                    return (
                      <div 
                        key={song.id} 
                        className="flex items-center gap-4 group cursor-pointer py-3 border-b border-white/5 hover:bg-white/5 px-3 rounded-lg transition-colors"
                        onClick={() => playArtistSongs(song, artistSongs)}
                      >
                        {/* Track Number / Play Icon */}
                        <div className="w-8 text-center flex-shrink-0">
                          <span className={`text-sm font-bold group-hover:hidden ${isCurrent ? 'text-[#fa2d48]' : 'text-white/20'}`}>
                            {index + 1}
                          </span>
                          <div className="hidden group-hover:flex items-center justify-center">
                            {isCurrentPlaying ? (
                              <Pause size={16} fill="white" className="text-white" />
                            ) : (
                              <Play size={16} fill="white" className="text-white" />
                            )}
                          </div>
                        </div>

                        {/* Album Art */}
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                          <img src={song.thumbnail} className="w-full h-full object-cover" />
                        </div>

                        {/* Song Info */}
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className={`text-sm font-bold truncate leading-tight ${isCurrent ? 'text-[#fa2d48]' : 'text-white'}`}>{song.title}</h3>
                          <p className="text-xs font-semibold text-white/40 truncate mt-1">{song.album || song.author}</p>
                        </div>

                        {/* Duration */}
                        <span className="text-xs font-bold text-white/20 tabular-nums flex-shrink-0">{song.duration}</span>
                      </div>
                    );
                  })}
               </div>
             </>
           )}
        </div>
      )}
    </div>
  );
}
