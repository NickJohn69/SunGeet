'use client';

import { useEffect, useState } from 'react';
import { Plus, ListMusic, Trash2, Play, SortAsc, Calendar, Clock, ChevronLeft, MoreVertical } from 'lucide-react';
import useStore from '../../store/useStore';
import PremiumGuard from '../../components/PremiumGuard';

export default function PlaylistsPage() {
  const { userPlaylists, fetchPlaylists, createPlaylist, deletePlaylist, setPlaylist, setCurrentSong, sortPlaylist, removeSongFromPlaylist } = useStore();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [menuOpenSongId, setMenuOpenSongId] = useState(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = () => setMenuOpenSongId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const result = await createPlaylist(newPlaylistName);
    if (result?.error === 'limit_reached') {
      setIsCreating(false);
      setShowGuard(true);
      return;
    }
    if (result) {
      setNewPlaylistName('');
      setIsCreating(false);
      setActivePlaylistId(result.id);
    }
  };

  const [showGuard, setShowGuard] = useState(false);

  const playPlaylist = (playlist) => {
    const songs = playlist.playlist_songs.map(ps => ({
      id: ps.song_id?.trim(),
      title: ps.title,
      author: ps.author,
      thumbnail: ps.thumbnail,
      localUrl: null
    }));
    if (songs.length > 0) {
      setPlaylist(songs);
      setCurrentSong(songs[0]);
      // Essential for mobile
      if (typeof window !== 'undefined' && window._sunGeetDirectPlay) {
        window._sunGeetDirectPlay(songs[0].id);
      }
    }
  };

  const activePlaylist = userPlaylists.find(p => p.id === activePlaylistId);

  return (
    <div className="animate-fade-in bg-black min-h-screen text-white">
      <div className="px-8 pt-12">
        {/* Header Logic */}
        {!activePlaylist ? (
          <div className="mb-12">
             <div className="flex items-end justify-between mb-10">
                <h1 className="text-[44px] font-black tracking-tight leading-none">Playlists</h1>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="bg-[#fa2d48] hover:bg-[#fa2d48]/80 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                   <Plus size={20} /> New Playlist
                </button>
             </div>

             {/* Creation Form Overlay */}
             {isCreating && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
                  <form onSubmit={handleCreate} className="bg-[#1c1c1e] border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
                     <h2 className="text-xl font-black mb-6">Name your playlist</h2>
                     <input 
                       autoFocus
                       type="text" 
                       value={newPlaylistName}
                       onChange={(e) => setNewPlaylistName(e.target.value)}
                       placeholder="My Awesome Mix"
                       className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-[#fa2d48] transition-all mb-6"
                     />
                     <div className="flex gap-4">
                        <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 text-white/40 font-bold hover:text-white transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-[#fa2d48] rounded-xl font-bold shadow-lg active:scale-95 transition-transform">Create</button>
                     </div>
                  </form>
               </div>
             )}

             {/* Playlists Grid (Folder style) */}
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                {userPlaylists.map(p => (
                   <div 
                     key={p.id} 
                     className="group cursor-pointer"
                     onClick={() => setActivePlaylistId(p.id)}
                   >
                      <div className="relative aspect-square rounded-[1.5rem] bg-gradient-to-br from-[#fa2d48]/20 to-[#af52de]/20 flex items-center justify-center mb-4 overflow-hidden shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-1">
                         {/* Visual stack effect for folder look */}
                         <div className="absolute inset-4 bg-white/5 rounded-2xl transform rotate-3" />
                         <div className="absolute inset-4 bg-white/5 rounded-2xl transform -rotate-3" />
                         <ListMusic size={64} className="text-[#fa2d48] z-10 transition-transform duration-500 group-hover:scale-110" />
                         
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play size={32} fill="white" className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300" />
                         </div>
                      </div>
                      <h3 className="font-bold truncate px-1">{p.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1 mt-1">Playlist • {p.playlist_songs?.length || 0} songs</p>
                   </div>
                ))}
                {userPlaylists.length === 0 && (
                  <div className="col-span-full py-20 text-center opacity-20">
                     <ListMusic size={80} className="mx-auto mb-4" />
                     <p className="text-lg font-bold">Your library is empty</p>
                  </div>
                )}
             </div>
          </div>
        ) : (
          /* Playlist Detail View */
          <div className="animate-fade-in pb-20">
             <button 
               onClick={() => setActivePlaylistId(null)}
               className="flex items-center gap-1 text-[#fa2d48] font-bold text-sm mb-8 hover:translate-x-[-4px] transition-transform"
             >
                <ChevronLeft size={18} /> Back to Playlists
             </button>

             <div className="flex flex-col md:flex-row items-end gap-10 mb-12">
                <div className="w-56 h-56 bg-gradient-to-br from-[#fa2d48]/20 to-[#af52de]/20 rounded-3xl flex items-center justify-center text-[#fa2d48] shadow-2xl shrink-0">
                   <ListMusic size={96} />
                </div>
                <div className="flex-1 w-full">
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-[#fa2d48] mb-3">SunGeet Playlist</p>
                   <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-tight">{activePlaylist.name}</h2>
                   <div className="flex flex-wrap items-center gap-6">
                      <button 
                        onClick={() => playPlaylist(activePlaylist)}
                        className="bg-white text-black px-10 py-3 rounded-full font-bold flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
                      >
                         <Play size={20} fill="black" /> Play all
                      </button>
                      
                      <div className="flex items-center gap-6">
                         <button onClick={() => sortPlaylist(activePlaylist.id, 'name')} className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                            <SortAsc size={16} /> Sort A-Z
                         </button>
                         <button onClick={() => sortPlaylist(activePlaylist.id, 'date')} className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                            <Calendar size={16} /> Recent
                         </button>
                         <button 
                           onClick={() => { deletePlaylist(activePlaylist.id); setActivePlaylistId(null); }}
                           className="text-white/20 hover:text-[#fa2d48] transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                         >
                            <Trash2 size={16} /> Delete
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="space-y-px mt-16 max-w-5xl">
                <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">
                   <span className="w-8">#</span>
                   <span className="flex-1">Title</span>
                   <span className="w-32">Added</span>
                </div>
                {activePlaylist.playlist_songs?.length === 0 && (
                   <div className="py-20 text-center text-white/20 italic">
                      This playlist is empty. Add some tracks from the home page.
                   </div>
                )}
                {activePlaylist.playlist_songs?.map((song, i) => (
                  <div 
                    key={song.id}
                    className="flex items-center gap-4 p-4 rounded-2xl group hover:bg-white/5 transition-all cursor-pointer"
                    onClick={() => {
                      const q = activePlaylist.playlist_songs.map(ps => ({
                        id: ps.song_id?.trim(),
                        title: ps.title,
                        author: ps.author,
                        thumbnail: ps.thumbnail,
                        localUrl: null
                      }));
                      setPlaylist(q);
                      setCurrentSong(q[i]);
                      // Essential for mobile
                      if (typeof window !== 'undefined' && window._sunGeetDirectPlay) {
                        window._sunGeetDirectPlay(q[i].id);
                      }
                    }}
                  >
                     <span className="w-8 text-[11px] font-black text-white/20 group-hover:text-white transition-colors">{i + 1}</span>
                     <img src={song.thumbnail} className="w-12 h-12 rounded-lg object-cover shadow-lg" />
                     <div className="flex-1 min-w-0">
                        <p className="text-base font-bold truncate group-hover:text-[#fa2d48] transition-colors">{song.title}</p>
                        <p className="text-sm text-white/40 truncate mt-1">{song.author}</p>
                     </div>
                     <span className="w-32 text-xs text-white/20 font-medium">{new Date(song.created_at).toLocaleDateString()}</span>
                     <div className="relative">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setMenuOpenSongId(menuOpenSongId === song.id ? null : song.id); 
                          }}
                          className="p-2 text-white/20 hover:text-white transition-opacity group-hover:opacity-100"
                        >
                           <MoreVertical size={18} />
                        </button>

                        {menuOpenSongId === song.id && (
                          <div className="absolute right-0 top-10 w-48 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] py-2 animate-fade-in overflow-hidden">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 removeSongFromPlaylist(activePlaylist.id, song.song_id);
                                 setMenuOpenSongId(null);
                               }}
                               className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#fa2d48]/10 text-[10px] font-black tracking-widest uppercase text-[#fa2d48] transition-all"
                             >
                                <Trash2 size={14} /> Remove from Mix
                             </button>
                          </div>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
      <PremiumGuard 
        isOpen={showGuard} 
        onClose={() => setShowGuard(false)} 
        featureName="Unlimited Playlists" 
      />
    </div>
  );
}
