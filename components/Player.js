'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic2, Maximize2, Repeat, Shuffle, ListPlus, X, Plus } from 'lucide-react';
import useStore from '../store/useStore';

const formatTime = (time) => {
  if (!time || isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function Player() {
  const { currentSong, isPlaying, setIsPlaying, volume, setVolume, playNext, playPrev, toggleLyricsMode, isLyricsMode, shuffle, toggleShuffle, repeat, toggleRepeat, playlist, userPlaylists, addSongToPlaylist, isSidebarOpen } = useStore();
  const [localAddingToPlaylist, setLocalAddingToPlaylist] = useState(null);
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const playPromiseRef = useRef(null);

  // Consolidated playback controller to prevent "play() interrupted by pause()" errors
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    const audio = audioRef.current;
    
    // Reset progress on new track
    const handleTrackChange = () => {
      audio.currentTime = 0;
    };

    if (isPlaying) {
      // Small delay to ensure browser is ready for new source if id just changed
      const playPromise = audio.play();
      playPromiseRef.current = playPromise;

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            playPromiseRef.current = null;
          })
          .catch(error => {
            playPromiseRef.current = null;
            if (error.name !== 'AbortError') {
              console.error("Playback failed:", error);
            }
          });
      }
    } else {
      // If a play is in progress, we wait for it to finish before pausing
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => {
          audio.pause();
        }).catch(() => {
          // Play was aborted anyway, so we just ensure it's paused
          audio.pause();
        });
      } else {
        audio.pause();
      }
    }
  }, [currentSong?.id, isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = repeat === 'one';
    }
  }, [repeat]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
      window.dispatchEvent(new CustomEvent('playerTimeUpdate', { 
        detail: { 
          currentTime: audioRef.current.currentTime,
          duration: audioRef.current.duration || 0
        } 
      }));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  useEffect(() => {
    const lyricsSeekHandler = (e) => {
      if (audioRef.current && !isNaN(e.detail.time)) {
        audioRef.current.currentTime = e.detail.time;
        setProgress(e.detail.time);
        if (!isPlaying) setIsPlaying(true);
      }
    };

    const togglePlayHandler = () => setIsPlaying(!isPlaying);

    window.addEventListener('lyricsSeek', lyricsSeekHandler);
    window.addEventListener('togglePlay', togglePlayHandler);

    return () => {
      window.removeEventListener('lyricsSeek', lyricsSeekHandler);
      window.removeEventListener('togglePlay', togglePlayHandler);
    };
  }, [isPlaying, setIsPlaying]);

  const handleKeyDown = useCallback((e) => {
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    switch (e.code) {
      case 'Space': e.preventDefault(); setIsPlaying(!isPlaying); break;
      case 'ArrowRight': if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 5, duration); break;
      case 'ArrowLeft': if (audioRef.current) audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 5, 0); break;
      case 'ArrowUp': e.preventDefault(); setVolume(Math.min(volume + 0.1, 1)); break;
      case 'ArrowDown': e.preventDefault(); setVolume(Math.max(volume - 0.1, 0)); break;
      case 'KeyM': if (volume > 0) { setPrevVolume(volume); setVolume(0); } else { setVolume(prevVolume || 1); } break;
      case 'KeyL': toggleLyricsMode(); break;
    }
  }, [isPlaying, volume, duration, prevVolume, setIsPlaying, setVolume, toggleLyricsMode]);

  useEffect(() => { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) { audioRef.current.currentTime = time; setProgress(time); }
  };

  const toggleMute = () => { if (volume > 0) { setPrevVolume(volume); setVolume(0); } else { setVolume(prevVolume || 1); } };

  if (!mounted || !currentSong) return null;

  const audioSrc = currentSong.localUrl || `/api/stream?id=${encodeURIComponent(currentSong.id)}`;

  return (
    <div className={`fixed bottom-0 right-0 z-50 bg-[#1c1c1e]/90 backdrop-blur-2xl border-t border-white/5 px-6 py-3 select-none pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 
      ${isSidebarOpen ? 'left-0 lg:left-64' : 'left-0 lg:left-20'}`}>
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          if (repeat === 'one') {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          } else {
            playNext();
          }
        }}
        loop={repeat === 'one'}
        autoPlay
      />

      {/* Mobile Progress (Top) */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 lg:hidden overflow-hidden">
        <div className="h-full bg-[#fa2d48] transition-all" style={{ width: `${(progress/(duration||1))*100}%` }} />
        <input type="range" min="0" max={duration || 100} value={progress} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
      </div>

      <div className="max-w-[1800px] mx-auto grid grid-cols-2 lg:grid-cols-3 items-center gap-4 h-full relative">
        
        {/* Left: Info */}
        <div 
          onClick={toggleLyricsMode}
          className="flex items-center gap-3 min-w-0 cursor-pointer group/info"
        >
          <div className="relative w-10 h-10 lg:w-14 lg:h-14 flex-shrink-0">
            <img src={currentSong.thumbnail} alt={currentSong.title} className="w-full h-full object-cover rounded-md shadow-lg group-hover/info:brightness-75 transition-all" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/info:opacity-100 transition-opacity">
              <Maximize2 size={14} className="text-white" />
            </div>
          </div>
          <div className="min-w-0 pr-2">
            <h4 className="text-[12px] lg:text-[14px] font-extrabold text-white truncate leading-tight group-hover/info:text-[#fa2d48] transition-colors">{currentSong.title}</h4>
            <p className="text-[10px] lg:text-[12px] font-bold text-white/40 truncate tracking-wide">{currentSong.author}</p>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-5 lg:gap-8">
            <button onClick={toggleShuffle} className={`hidden lg:block transition-colors ${shuffle ? 'text-[#fa2d48]' : 'text-white/30 hover:text-white'}`}><Shuffle size={16} /></button>
            <div className="flex items-center gap-4 lg:gap-7">
              <button onClick={playPrev} className="hidden lg:block text-white/40 hover:text-white transition-all transform active:scale-90"><SkipBack size={24} fill="currentColor" /></button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all border border-white/5 rounded-full bg-white/5"
              >
                {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" className="ml-1" />}
              </button>
              <button onClick={playNext} className="text-white/40 hover:text-white transition-all transform active:scale-90"><SkipForward size={24} fill="currentColor" /></button>
            </div>
            <button onClick={toggleRepeat} className={`hidden lg:block transition-colors relative ${repeat !== 'none' ? 'text-[#fa2d48]' : 'text-white/30 hover:text-white'}`}>
              <Repeat size={16} />
              {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
            </button>
          </div>

          {/* Desktop Progress Bar */}
          <div className="hidden lg:flex items-center gap-3 w-full max-w-md">
            <span className="text-[10px] font-bold text-white/20 w-8 text-right tabular-nums">{formatTime(progress)}</span>
            <div className="relative flex-1 h-1 flex items-center group/scrub">
              <input type="range" min="0" max={duration || 100} value={progress} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white group-hover/scrub:bg-[#fa2d48] transition-colors" style={{ width: `${(progress/(duration||1))*100}%` }} />
              </div>
            </div>
            <span className="text-[10px] font-bold text-white/20 w-8 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center justify-end gap-2 lg:gap-6 pr-2">
          <button onClick={() => setLocalAddingToPlaylist(currentSong)} className="text-white/40 hover:text-[#fa2d48] transition-all"><ListPlus size={20} /></button>
          <button onClick={toggleLyricsMode} className={`transition-all ${isLyricsMode ? 'text-[#fa2d48]' : 'text-white/40 hover:text-white'}`}><Mic2 size={20} /></button>
          
          <div className="hidden lg:flex items-center gap-3 group/vol relative">
            <button onClick={toggleMute} className="text-white/40 hover:text-white transition-all">{volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <div className="relative w-24 h-1 flex items-center">
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all" style={{ width: `${volume*100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Overlay */}
      {localAddingToPlaylist && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in text-white" 
          onClick={() => setLocalAddingToPlaylist(null)}
        >
           <div 
             className="bg-[#1c1c1e] border border-white/10 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
             onClick={e => e.stopPropagation()}
           >
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
                 <h3 className="text-xl font-black">Quick Save</h3>
                 <button onClick={() => setLocalAddingToPlaylist(null)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-4 overflow-y-auto no-scrollbar max-h-[440px]">
                 {userPlaylists.length === 0 ? (
                   <div className="p-12 text-center">
                      <p className="text-white/40 text-sm mb-4 italic">No mixes found.</p>
                      <button onClick={() => { window.location.href = '/playlists'; setLocalAddingToPlaylist(null); }} className="text-[#fa2d48] font-bold text-sm uppercase tracking-widest">Create Your First Mix</button>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     {userPlaylists.map(p => (
                       <button 
                         key={p.id}
                         onClick={async () => {
                           const result = await addSongToPlaylist(p.id, localAddingToPlaylist);
                           if (result?.error === 'limit_reached') {
                             setLocalAddingToPlaylist(null);
                             alert(`Premium Required: You've reached the free limit of ${result.limit} songs for this playlist.`);
                             return;
                           }
                           setLocalAddingToPlaylist(null);
                         }}
                         className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all group"
                       >
                          <div className="w-10 h-10 bg-[#fa2d48]/10 rounded-xl flex items-center justify-center text-[#fa2d48] group-hover:bg-[#fa2d48] group-hover:text-white transition-colors">
                             <Plus size={20} />
                          </div>
                          <span className="font-bold text-base truncate">{p.name}</span>
                       </button>
                     ))}
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

