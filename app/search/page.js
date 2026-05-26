'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Play, ListPlus, X, Loader2, Search as SearchIcon } from 'lucide-react';
import useStore from '../../store/useStore';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setCurrentSong, currentSong, isPlaying, setIsPlaying, setAddingToPlaylist, addSongToPlaylist, userPlaylists } = useStore();
  const [localAddingToPlaylist, setLocalAddingToPlaylist] = useState(null);

  useEffect(() => {
    if (query) {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => { setResults(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [query]);

  const playSong = (song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
    }
  };

  return (
    <div className="px-8 pb-32 pt-12 animate-fade-in bg-black min-h-screen text-white">
      <div className="flex items-center justify-between mb-12">
         <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#fa2d48] mb-2">Search Results</p>
            <h1 className="text-4xl font-black tracking-tighter">Showing results for "{query}"</h1>
         </div>
         <div className="text-white/20 font-bold text-sm">{results.length} tracks found</div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 opacity-20">
           <Loader2 size={48} className="animate-spin mb-4" />
           <p className="text-lg font-bold">Searching the library...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8">
          {results.map((song) => {
            const isCurrent = currentSong?.id === song.id;
            return (
              <div 
                key={song.id} 
                className="group relative flex flex-col bg-white/5 border border-white/5 rounded-3xl p-4 transition-all hover:bg-white/10 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 shadow-xl">
                  <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     <button 
                       onClick={() => playSong(song)}
                       className="w-14 h-14 bg-[#fa2d48] rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-90 transition-all"
                     >
                        {isCurrent && isPlaying ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} fill="white" className="ml-1" />}
                     </button>
                  </div>
                </div>

                <div className="flex-1 min-w-0 mb-4 px-1">
                  <h3 className={`text-lg font-black truncate leading-tight mb-1 ${isCurrent ? 'text-[#fa2d48]' : 'text-white'}`}>{song.title}</h3>
                  <p className="text-sm font-bold text-white/30 truncate">{song.author}</p>
                </div>

                <button 
                  onClick={() => setLocalAddingToPlaylist(song)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-colors border border-white/5 group-hover:border-[#fa2d48]/20 group-hover:text-white"
                >
                   <ListPlus size={16} className="text-[#fa2d48]" /> Save to Playlist
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 opacity-10">
           <SearchIcon size={80} className="mb-4" />
           <p className="text-xl font-bold">No tracks found for "{query}"</p>
        </div>
      )}

      {/* Playlist Picker Overlay */}
      {localAddingToPlaylist && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in text-white">
           <div className="bg-[#1c1c1e] border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                 <h3 className="text-xl font-black">Add to Playlist</h3>
                 <button onClick={() => setLocalAddingToPlaylist(null)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto no-scrollbar">
                 {userPlaylists.length === 0 ? (
                   <div className="p-12 text-center">
                      <p className="text-white/40 text-sm mb-6">Create your first playlist to save tracks!</p>
                      <button 
                        onClick={() => window.location.href = '/playlists'}
                        className="bg-[#fa2d48] px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest"
                      >
                         Create Playlist
                      </button>
                   </div>
                 ) : userPlaylists.map(p => (
                   <button 
                     key={p.id}
                     onClick={async () => {
                       await addSongToPlaylist(p.id, localAddingToPlaylist);
                       setLocalAddingToPlaylist(null);
                     }}
                     className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all group"
                   >
                      <div className="w-12 h-12 bg-[#fa2d48]/10 rounded-xl flex items-center justify-center text-[#fa2d48] group-hover:bg-[#fa2d48] group-hover:text-white transition-colors">
                         <ListPlus size={24} />
                      </div>
                      <div className="flex flex-col items-start">
                         <span className="font-bold text-lg">{p.name}</span>
                         <span className="text-[10px] uppercase font-black tracking-widest text-white/20 group-hover:text-white/40">{p.playlist_songs?.length || 0} tracks</span>
                      </div>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
       <div className="flex items-center justify-center h-screen bg-black text-[#fa2d48]">
          <Loader2 size={48} className="animate-spin" />
       </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
