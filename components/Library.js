'use client';

import { Play, Pause, ChevronRight, MoreHorizontal, Plus, Check, Shuffle, ListPlus, X } from 'lucide-react';
import useStore from '../store/useStore';
import PremiumGuard from './PremiumGuard';
import { useEffect, useState } from 'react';

export default function Library() {
  const { 
    setCurrentSong, currentSong, isPlaying, setIsPlaying, 
    userPlaylists, fetchPlaylists, addSongToPlaylist, setPlaylist 
  } = useStore();
  
  const [mounted, setMounted] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState(null); // song object
  const [showGuard, setShowGuard] = useState(false);

  useEffect(() => { 
    setMounted(true);
    fetchPlaylists();
  }, []);

  useEffect(() => {
    if (mounted) {
      setLoadingRecs(true);
      const fetchDiverseRecs = async () => {
        try {
          const queries = ['new music releases 2024', 'popular hits 2024', 'latest trending songs'];
          const results = await Promise.all(
            queries.map(q => fetch(`/api/search?q=${encodeURIComponent(q)}`).then(res => res.json()))
          );
          
          // Combine and deduplicate
          const allSongs = results.flat().filter(song => song && song.id);
          const uniqueSongs = Array.from(new Map(allSongs.map(s => [s.id, s])).values());
          
          // Shuffle for "random" feel as requested
          const shuffled = uniqueSongs.sort(() => Math.random() - 0.5);
          
          setRecommendations(shuffled.slice(0, 48));
          setLoadingRecs(false);
        } catch (err) {
          console.error('Error fetching recommendations:', err);
          setLoadingRecs(false);
        }
      };
      
      fetchDiverseRecs();
    }
  }, [mounted]);

  const playSong = (song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
    }
  };

  const shuffleLibrary = () => {
    if (recommendations.length > 0) {
      const shuffled = [...recommendations].sort(() => Math.random() - 0.5);
      setPlaylist(shuffled);
      setCurrentSong(shuffled[0]);
    }
  };

  if (!mounted) return null;

  return (
    <div className="px-8 pb-32 animate-fade-in bg-black min-h-screen text-white relative">
      {/* Header section with Shuffle button */}
      <div className="pt-12 mb-10 flex items-end justify-between">
         <div>
            <h1 className="text-[44px] font-black tracking-tight leading-none mb-4">New</h1>
            <div className="h-[1px] bg-white/10 w-48" />
         </div>
         <button 
           onClick={shuffleLibrary}
           className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 border border-white/5"
         >
            <Shuffle size={18} className="text-[#fa2d48]" /> Shuffle Library
         </button>
      </div>

      {/* Featured Banner Section */}
      <section className="mb-16 overflow-x-auto no-scrollbar -mx-8 px-8">
        <div className="flex gap-6 min-w-max">
          {(loadingRecs ? Array.from({ length: 3 }) : recommendations.slice(0, 3)).map((song, i) => (
            song ? (
              <div key={i} className="w-[380px] md:w-[480px] space-y-4 group">
                 <div className="space-y-1">
                   <p className="text-[10px] font-bold text-[#fa2d48] uppercase tracking-[0.2em]">{i === 0 ? 'EDITOR\'S PICK' : 'NEW RELEASE'}</p>
                   <h3 className="text-xl font-bold line-clamp-1">{song.title}</h3>
                   <p className="text-sm text-white/40">{song.author}</p>
                 </div>
                 <div 
                   className="relative aspect-[16/9] rounded-xl overflow-hidden cursor-pointer shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
                   onClick={() => playSong(song)}
                 >
                   <img src={song.thumbnail} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                      <p className="text-sm font-medium text-white/80 line-clamp-1">Listen to {song.author}'s latest masterpiece.</p>
                   </div>
                 </div>
              </div>
            ) : (
              <div key={i} className="w-[380px] md:w-[480px] space-y-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-2 bg-white/5 rounded w-20" />
                  <div className="h-6 bg-white/5 rounded w-3/4" />
                  <div className="h-4 bg-white/5 rounded w-1/2" />
                </div>
                <div className="aspect-[16/9] rounded-xl bg-white/5" />
              </div>
            )
          ))}
        </div>
      </section>

      {/* Best New Songs Grid */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-1 hover:text-[#fa2d48] cursor-pointer transition-colors group">
             <h2 className="text-[28px] font-black tracking-tight">Best New Songs</h2>
             <ChevronRight size={28} className="mt-1 opacity-40 group-hover:opacity-100" />
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-4">
          {(loadingRecs ? Array.from({ length: 12 }) : recommendations.slice(3, 15)).map((song, i) => (
            song ? (
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
                  <h3 className={`text-sm font-bold truncate leading-tight ${currentSong?.id === song.id ? 'text-[#fa2d48]' : 'text-white'}`}>{song.title}</h3>
                  <p className="text-xs font-semibold text-white/40 truncate mt-1">{song.author}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={(e) => { e.stopPropagation(); setAddingToPlaylist(song); }}
                     className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                     title="Add to Playlist"
                   >
                      <ListPlus size={18} />
                   </button>
                   <button className="p-2 text-white/40 hover:text-white transition-opacity">
                      <MoreHorizontal size={18} />
                   </button>
                </div>
              </div>
            ) : (
              <div key={i} className="flex items-center gap-4 py-1.5">
                 <div className="w-12 h-12 bg-white/5 rounded-lg animate-pulse" />
                 <div className="flex-1 space-y-2">
                   <div className="h-3 bg-white/5 rounded w-3/4 animate-pulse" />
                   <div className="h-2 bg-white/5 rounded w-1/2 animate-pulse" />
                 </div>
              </div>
            )
          ))}
        </div>
      </section>

      {/* New This Week - Row of Square Cards */}
      <section>
        <div className="flex items-center gap-1 mb-8 hover:text-[#fa2d48] cursor-pointer transition-colors group">
          <h2 className="text-[28px] font-black tracking-tight">New This Week</h2>
          <ChevronRight size={28} className="mt-1 opacity-40 group-hover:opacity-100" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
           {(loadingRecs ? Array.from({ length: 6 }) : recommendations.slice(15, 21)).map((song, i) => (
             song ? (
              <div key={song.id} className="group cursor-pointer relative" onClick={() => playSong(song)}>
                <div className="relative aspect-square rounded-[1.2rem] overflow-hidden mb-3 shadow-lg transition-all duration-300 group-hover:shadow-2xl">
                   <img src={song.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setAddingToPlaylist(song); }}
                        className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:scale-110 transition-transform"
                      >
                         <ListPlus size={20} />
                      </button>
                   </div>
                </div>
                <h3 className="text-sm font-bold truncate group-hover:text-[#fa2d48] transition-colors">{song.title}</h3>
                <p className="text-xs font-semibold text-white/40 truncate mt-0.5">{song.author}</p>
              </div>
             ) : (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-[1.2rem] bg-white/5 mb-3" />
                <div className="h-3 bg-white/5 rounded w-3/4 mb-2" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
             )
           ))}
        </div>
      </section>

      {/* Playlist Picker Overlay */}
      {addingToPlaylist && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in text-white">
           <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                 <h3 className="font-bold">Add to Playlist</h3>
                 <button onClick={() => setAddingToPlaylist(null)} className="text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto no-scrollbar">
                 {userPlaylists.length === 0 ? (
                   <div className="p-8 text-center">
                      <p className="text-white/40 text-sm mb-4">You haven't created any playlists yet.</p>
                      <button 
                        onClick={() => window.location.href = '/playlists'}
                        className="text-[#fa2d48] font-bold text-sm"
                      >
                         Go to Playlists
                      </button>
                   </div>
                 ) : userPlaylists.map(p => (
                   <button 
                     key={p.id}
                     onClick={async () => {
                       const result = await addSongToPlaylist(p.id, addingToPlaylist);
                       if (result?.error === 'limit_reached') {
                         setAddingToPlaylist(null);
                         setShowGuard(true);
                         return;
                       }
                       setAddingToPlaylist(null);
                     }}
                     className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors group"
                   >
                      <div className="w-10 h-10 bg-[#fa2d48]/10 rounded-lg flex items-center justify-center text-[#fa2d48]">
                         <Plus size={20} />
                      </div>
                      <span className="font-bold text-left">{p.name}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}
      <PremiumGuard 
        isOpen={showGuard} 
        onClose={() => setShowGuard(false)} 
        featureName="Unlimited Songs per Playlist" 
      />
    </div>
  );
}
