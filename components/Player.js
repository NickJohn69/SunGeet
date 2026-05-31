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
  const [playerReady, setPlayerReady] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const progressInterval = useRef(null);
  const currentSongIdRef = useRef(null);
  const isPlayingRef = useRef(false);
  const keepaliveRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const playAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.play().catch(() => {});
  }, []);

  const pauseAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  // Load song into audio element when currentSong changes
  useEffect(() => {
    if (!currentSong || !mounted) return;

    currentSongIdRef.current = currentSong.id;
    setProgress(0);
    setDuration(0);
    setStreamError(false);

    const audio = audioRef.current;
    if (!audio) return;

    // Stop any current playback
    audio.pause();
    audio.src = '';
    audio.load();

    // Set new source
    audio.src = `/api/stream?id=${currentSong.id}`;
    audio.load();

    if (isPlaying) {
      const tryPlay = () => {
        audio.play().catch((err) => {
          setStreamError(true);
        });
      };
      audio.addEventListener('canplay', tryPlay, { once: true });
      // Also try immediately (in case already loaded)
      setTimeout(tryPlay, 100);
    }
  }, [currentSong?.id, mounted]);

  // React to isPlaying changes
  useEffect(() => {
    if (!playerReady || !audioRef.current) return;
    if (isPlaying) {
      playAudio();
    } else {
      pauseAudio();
    }
  }, [isPlaying, playerReady, playAudio, pauseAudio]);

  // Volume changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  // Progress tracking via timeupdate
  useEffect(() => {
    if (!playerReady || !isPlaying || !audioRef.current) return;

    const updateProgress = () => {
      if (!audioRef.current) return;
      const currentTime = audioRef.current.currentTime || 0;
      const dur = audioRef.current.duration || 0;
      setProgress(currentTime);
      if (dur > 0) setDuration(dur);

      // Sync Media Session Position State
      if ('mediaSession' in navigator && dur > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: 1,
            position: currentTime
          });
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('playerTimeUpdate', {
        detail: { currentTime, duration: dur }
      }));
    };

    const interval = setInterval(updateProgress, 250);
    return () => clearInterval(interval);
  }, [isPlaying, playerReady]);

  // Expose direct play function to window for other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._sunGeetDirectPlay = (songId) => {
        if (audioRef.current) {
          audioRef.current.src = `/api/stream?id=${songId}`;
          audioRef.current.load();
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      };
    }
  }, [setIsPlaying]);

  // ── Background playback keepalive ──────────────────────────────
  useEffect(() => {
    if (!playerReady || !isPlaying) {
      if (keepaliveRef.current) {
        clearInterval(keepaliveRef.current);
        keepaliveRef.current = null;
      }
      return;
    }

    keepaliveRef.current = setInterval(() => {
      try {
        if (audioRef.current && isPlayingRef.current) {
          if (audioRef.current.paused && !audioRef.current.ended) {
            audioRef.current.play().catch(() => {});
          }
        }
      } catch (e) {}
    }, 2000);

    return () => {
      if (keepaliveRef.current) {
        clearInterval(keepaliveRef.current);
        keepaliveRef.current = null;
      }
    };
  }, [isPlaying, playerReady]);

  // Media Session API for Lock Screen Controls
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentSong.title,
      artist: currentSong.author,
      album: 'SunGeet',
      artwork: [
        { src: currentSong.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        { src: currentSong.thumbnail, sizes: '384x384', type: 'image/jpeg' },
        { src: currentSong.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        { src: currentSong.thumbnail, sizes: '192x192', type: 'image/jpeg' },
        { src: currentSong.thumbnail, sizes: '128x128', type: 'image/jpeg' },
        { src: currentSong.thumbnail, sizes: '96x96', type: 'image/jpeg' },
      ]
    });

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    const handlers = [
      ['play', () => { setIsPlaying(true); playAudio(); }],
      ['pause', () => { setIsPlaying(false); pauseAudio(); }],
      ['previoustrack', () => playPrev()],
      ['nexttrack', () => playNext()],
      ['seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        const newTime = Math.max(progress - skipTime, 0);
        if (audioRef.current) audioRef.current.currentTime = newTime;
        setProgress(newTime);
      }],
      ['seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        const newTime = Math.min(progress + skipTime, duration);
        if (audioRef.current) audioRef.current.currentTime = newTime;
        setProgress(newTime);
      }],
      ['seekto', (details) => {
        if (audioRef.current) audioRef.current.currentTime = details.seekTime;
        setProgress(details.seekTime);
      }],
    ];

    for (const [action, handler] of handlers) {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch (e) {}
    }

    return () => {
      for (const [action] of handlers) {
        try { navigator.mediaSession.setActionHandler(action, null); } catch (e) {}
      }
    };
  }, [currentSong, playNext, playPrev, setIsPlaying, progress, duration, playerReady, isPlaying, playAudio, pauseAudio]);

  useEffect(() => {
    const lyricsSeekHandler = (e) => {
      if (audioRef.current && !isNaN(e.detail.time)) {
        audioRef.current.currentTime = e.detail.time;
        setProgress(e.detail.time);
        if (!isPlaying) setIsPlaying(true);
      }
    };

    const togglePlayHandler = () => setIsPlaying(!isPlaying);

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible' && isPlaying && audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
      }
    };

    window.addEventListener('lyricsSeek', lyricsSeekHandler);
    window.addEventListener('togglePlay', togglePlayHandler);
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      window.removeEventListener('lyricsSeek', lyricsSeekHandler);
      window.removeEventListener('togglePlay', togglePlayHandler);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, [isPlaying, setIsPlaying]);

  const handleKeyDown = useCallback((e) => {
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    switch (e.code) {
      case 'Space': e.preventDefault(); setIsPlaying(!isPlaying); break;
      case 'ArrowRight': 
        if (audioRef.current) {
          const newTime = Math.min(progress + 5, duration);
          audioRef.current.currentTime = newTime;
          setProgress(newTime);
        }
        break;
      case 'ArrowLeft': 
        if (audioRef.current) {
          const newTime = Math.max(progress - 5, 0);
          audioRef.current.currentTime = newTime;
          setProgress(newTime);
        }
        break;
      case 'ArrowUp': e.preventDefault(); setVolume(Math.min(volume + 0.1, 1)); break;
      case 'ArrowDown': e.preventDefault(); setVolume(Math.max(volume - 0.1, 0)); break;
      case 'KeyM': if (volume > 0) { setPrevVolume(volume); setVolume(0); } else { setVolume(prevVolume || 1); } break;
      case 'KeyL': toggleLyricsMode(); break;
    }
  }, [isPlaying, volume, duration, progress, prevVolume, setIsPlaying, setVolume, toggleLyricsMode]);

  useEffect(() => { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const toggleMute = () => { if (volume > 0) { setPrevVolume(volume); setVolume(0); } else { setVolume(prevVolume || 1); } };

  if (!mounted || !currentSong) return null;

  return (
    <>
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        onLoadedMetadata={() => {
          setPlayerReady(true);
          if (audioRef.current) {
            audioRef.current.volume = volume;
            setDuration(audioRef.current.duration || 0);
          }
          if (isPlayingRef.current) {
            audioRef.current?.play().catch(() => {});
          }
        }}
        onEnded={() => {
          if (isPlayingRef.current) {
            const store = useStore.getState();
            if (store.repeat === 'one') {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
              }
            } else {
              store.playNext();
            }
          }
        }}
        onError={() => {
          setStreamError(true);
          setTimeout(() => {
            const store = useStore.getState();
            store.playNext();
          }, 1500);
        }}
        onPlay={() => setPlayerReady(true)}
      />

      <div className={`fixed bottom-0 right-0 z-50 bg-[#1c1c1e]/90 backdrop-blur-2xl border-t border-white/5 px-6 py-3 select-none pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 
        ${isSidebarOpen ? 'left-0 lg:left-64' : 'left-0 lg:left-20'}`}>

        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 lg:hidden overflow-hidden">
          <div className="h-full bg-[#fa2d48] transition-all" style={{ width: `${(progress/(duration||1))*100}%` }} />
          <input type="range" min="0" max={duration || 100} value={progress} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
        </div>

        <div className="max-w-[1800px] mx-auto grid grid-cols-2 lg:grid-cols-3 items-center gap-4 h-full relative">
          
          <div onClick={toggleLyricsMode} className="flex items-center gap-3 min-w-0 cursor-pointer group/info">
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

        {localAddingToPlaylist && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in text-white" onClick={() => setLocalAddingToPlaylist(null)}>
             <div className="bg-[#1c1c1e] border border-white/10 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
                   <h3 className="text-xl font-black">Quick Save</h3>
                   <button onClick={() => setLocalAddingToPlaylist(null)} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"><X size={20} /></button>
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
                         <button key={p.id} onClick={async () => {
                             const result = await addSongToPlaylist(p.id, localAddingToPlaylist);
                             if (result?.error === 'limit_reached') {
                               setLocalAddingToPlaylist(null);
                               alert(`Premium Required: You've reached the free limit of ${result.limit} songs for this playlist.`);
                               return;
                             }
                             setLocalAddingToPlaylist(null);
                           }} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all group">
                            <div className="w-10 h-10 bg-[#fa2d48]/10 rounded-xl flex items-center justify-center text-[#fa2d48] group-hover:bg-[#fa2d48] group-hover:text-white transition-colors"><Plus size={20} /></div>
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
    </>
  );
}
