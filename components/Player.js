'use client';
import { supabase } from '../lib/supabase';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic2, Maximize2, Repeat, Shuffle, ListPlus, X, Plus } from 'lucide-react';
import useStore from '../store/useStore';

const formatTime = (time) => {
  if (!time || isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// ── Desktop: YouTube IFrame player ──────────────────────────────
let ytApiReady = false;
let ytApiPromise = null;

function loadYTApi() {
  if (ytApiReady) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) { ytApiReady = true; resolve(); return; }
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { ytApiReady = true; if (prevCallback) prevCallback(); resolve(); };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

// ── Shared UI ──────────────────────────────────────────────────
function PlayerBar({ 
  currentSong, 
  isPlaying, 
  progress, 
  duration, 
  isSidebarOpen, 
  onToggleLyrics, 
  onPlayPause, 
  onPrev, 
  onNext, 
  onShuffle, 
  onRepeat, 
  shuffle, 
  repeat, 
  onListAdd, 
  onSeekStart,
  onSeekChange,
  onSeekEnd, 
  volume, 
  onVolumeChange, 
  onToggleMute, 
  children 
}) {
  return (
    <div className={`fixed bottom-0 right-0 z-50 bg-[#1c1c1e]/90 backdrop-blur-2xl border-t border-white/5 px-6 py-3 select-none pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 
      ${isSidebarOpen ? 'left-0 lg:left-64' : 'left-0 lg:left-20'}`}>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 lg:hidden overflow-hidden">
        <div className="h-full bg-[#fa2d48] transition-all" style={{ width: `${(progress/(duration||1))*100}%` }} />
        <input 
          type="range" 
          min="0" 
          max={duration || 100} 
          value={progress} 
          onMouseDown={onSeekStart}
          onTouchStart={onSeekStart}
          onChange={onSeekChange}
          onMouseUp={onSeekEnd}
          onTouchEnd={onSeekEnd}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" 
        />
      </div>
      <div className="max-w-[1800px] mx-auto grid grid-cols-2 lg:grid-cols-3 items-center gap-4 h-full relative">
        <div onClick={onToggleLyrics} className="flex items-center gap-3 min-w-0 cursor-pointer group/info">
          <div className="relative w-10 h-10 lg:w-14 lg:h-14 flex-shrink-0">
            <img src={currentSong.thumbnail} alt={currentSong.title} className="w-full h-full object-cover rounded-md shadow-lg group-hover/info:brightness-75 transition-all" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/info:opacity-100 transition-opacity"><Maximize2 size={14} className="text-white" /></div>
          </div>
          <div className="min-w-0 pr-2">
            <h4 className="text-[12px] lg:text-[14px] font-extrabold text-white truncate leading-tight group-hover/info:text-[#fa2d48] transition-colors">{currentSong.title}</h4>
            <p className="text-[10px] lg:text-[12px] font-bold text-white/40 truncate tracking-wide">{currentSong.author}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-5 lg:gap-8">
            <button onClick={onShuffle} className={`hidden lg:block transition-colors ${shuffle ? 'text-[#fa2d48]' : 'text-white/30 hover:text-white'}`}><Shuffle size={16} /></button>
            <div className="flex items-center gap-4 lg:gap-7">
              <button onClick={onPrev} className="hidden lg:block text-white/40 hover:text-white transition-all transform active:scale-90"><SkipBack size={24} fill="currentColor" /></button>
              <button onClick={onPlayPause} className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all border border-white/5 rounded-full bg-white/5">
                {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" className="ml-1" />}
              </button>
              <button onClick={onNext} className="text-white/40 hover:text-white transition-all transform active:scale-90"><SkipForward size={24} fill="currentColor" /></button>
            </div>
            <button onClick={onRepeat} className={`hidden lg:block transition-colors relative ${repeat !== 'none' ? 'text-[#fa2d48]' : 'text-white/30 hover:text-white'}`}>
              <Repeat size={16} />
              {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-3 w-full max-w-md">
            <span className="text-[10px] font-bold text-white/20 w-8 text-right tabular-nums">{formatTime(progress)}</span>
            <div className="relative flex-1 h-1 flex items-center group/scrub">
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={progress} 
                onMouseDown={onSeekStart}
                onTouchStart={onSeekStart}
                onChange={onSeekChange}
                onMouseUp={onSeekEnd}
                onTouchEnd={onSeekEnd}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" 
              />
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white group-hover/scrub:bg-[#fa2d48] transition-colors" style={{ width: `${(progress/(duration||1))*100}%` }} />
              </div>
            </div>
            <span className="text-[10px] font-bold text-white/20 w-8 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 lg:gap-6 pr-2">
          <button onClick={onListAdd} className="text-white/40 hover:text-[#fa2d48] transition-all"><ListPlus size={20} /></button>
          <button onClick={onToggleLyrics} className={`transition-all ${false ? 'text-[#fa2d48]' : 'text-white/40 hover:text-white'}`}><Mic2 size={20} /></button>
          <div className="hidden lg:flex items-center gap-3 group/vol relative">
            <button onClick={onToggleMute} className="text-white/40 hover:text-white transition-all">{volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <div className="relative w-24 h-1 flex items-center">
              <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => onVolumeChange(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all" style={{ width: `${volume*100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Native HTML5 Audio Player (Using YT Proxy) ─────────────────
function YTStreamPlayer({ currentSong, isPlaying, setIsPlaying, volume, setVolume, playNext, playPrev, isSidebarOpen, isLyricsMode, toggleLyricsMode, toggleShuffle, shuffle, toggleRepeat, repeat, userPlaylists, addSongToPlaylist }) {
  const [localAddingToPlaylist, setLocalAddingToPlaylist] = useState(null);
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mounted, setMounted] = useState(false);
  const currentSongIdRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Smooth scrubbing state and refs to bypass closures
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const isScrubbingRef = useRef(false);
  const prevVolumeRef = useRef(1);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Keep track of non-mute volume for toggle-mute fallback
  useEffect(() => {
    if (volume > 0) {
      prevVolumeRef.current = volume;
    }
  }, [volume]);

  // Audio element initialization
  useEffect(() => {
    if (!mounted) return;
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    const onTimeUpdate = () => {
      const currentTime = audio.currentTime || 0;
      const dur = audio.duration || 0;
      
      // Update normal progress only when NOT scrubbing
      if (!isScrubbingRef.current) {
        setProgress(currentTime);
      }
      if (dur > 0) setDuration(dur);

      if ('mediaSession' in navigator && dur > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: 1,
            position: Math.min(currentTime, dur),
          });
        } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent('playerTimeUpdate', { detail: { currentTime, duration: dur } }));
    };

    const onEnded = () => {
      const audio = audioRef.current;
      // Safety check: Don't skip if the song hasn't actually played for at least 2 seconds
      // This prevents "ghost" ended events on stream resets
      if (audio && audio.currentTime < 2) {
        console.warn('Ended event fired prematurely (skipping skip)');
        return;
      }

      const store = useStore.getState();
      if (store.repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        store.playNext();
      }
    };

    const onLoadedMetadata = () => {
      const dur = audio.duration || 0;
      if (dur > 0) setDuration(dur);
    };

    const onError = (e) => {
      const audio = audioRef.current;
      if (!audio) return;
      const errorMsg = audio.error ? `Code: ${audio.error.code}, Message: ${audio.error.message}` : 'Unknown error';
      console.error('Audio stream error details:', errorMsg);
      
      // If the error happened immediately, try to reload once before skipping
      if (audio.currentTime < 1 && isPlayingRef.current) {
         console.warn('Load error at start. Retrying source...');
         audio.load();
         audio.play().catch(() => {});
         return;
      }

      if (isPlayingRef.current) {
        console.warn('Playback stalled. Attempting recovery or skip...');
        setTimeout(() => {
          if (isPlayingRef.current && (audio.error || audio.paused)) {
            // Only skip if still in error state after 5 seconds
            useStore.getState().playNext();
          }
        }, 5000);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);

    // Keep-alive interval for background playback stability
    const keepalive = setInterval(() => {
      if (isPlayingRef.current && audio.paused && audio.src && audio.readyState >= 2) {
        console.log('Background keep-alive: Resuming paused audio');
        audio.play().catch(() => {});
      }
    }, 3000);

    return () => {
      clearInterval(keepalive);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
    };
  }, [mounted]);

  // Visibility handler for background resume
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isPlayingRef.current && audioRef.current?.paused) {
        audioRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Load song Change
  useEffect(() => {
    if (!mounted || !audioRef.current || !currentSong) return;
    
    if (currentSongIdRef.current !== currentSong.id) {
      currentSongIdRef.current = currentSong.id;
      const audio = audioRef.current;
      
      // Stop current playback cleanly
      audio.pause();
      
      // Clear progress immediately to avoid UI jumps
      setProgress(0);
      setDuration(currentSong.durationSeconds || 0);

      // Reset the source and explicitly load
      const fetchAudioUrl = async () => {
        try {
          const res = await fetch(`/api/stream?q=${currentSong.id}&_t=${Date.now()}`);
          const data = await res.json();
          const url = data.chosen?.url || data.audioUrl || (data.formats && data.formats[0]?.url);
          if (!url) {
            console.error('No audio URL returned from stream API:', data.error || 'Unknown error');
            // On failure, try to skip to the next song after a delay
            setTimeout(() => {
              if (currentSongIdRef.current === currentSong.id) {
                useStore.getState().playNext();
              }
            }, 2000);
            return;
          }
          
          // Route through our proxy to avoid CORS issues with YouTube CDN
          const proxyUrl = `/api/stream-proxy?url=${encodeURIComponent(url)}`;
          
          if (audio.src && audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(audio.src);
          }
          audio.src = proxyUrl;
          audio.load();
          
          // Wait for canplay event before attempting playback
          const onCanPlay = () => {
            audio.removeEventListener('canplay', onCanPlay);
            if (isPlayingRef.current && currentSongIdRef.current === currentSong.id) {
              audio.play().catch((err) => {
                console.warn('Auto-play prevented:', err.message);
              });
            }
          };
          audio.addEventListener('canplay', onCanPlay);
        } catch (e) {
          console.error('Failed to fetch audio URL:', e);
        }
      };
      fetchAudioUrl();
    }
  }, [currentSong?.id, mounted, setIsPlaying]);

  // Play/Pause
  useEffect(() => {
    if (!mounted || !audioRef.current) return;
    const audio = audioRef.current;
    if (isPlaying) {
      if (audio.paused && audio.src) audio.play().catch(() => {});
    } else {
      if (!audio.paused) audio.pause();
    }
  }, [isPlaying, mounted]);

  // Volume
  useEffect(() => {
    if (!mounted || !audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume, mounted]);

  // Media Session
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentSong.title,
      artist: currentSong.author,
      album: 'SunGeet',
      artwork: [
        { src: currentSong.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        { src: currentSong.thumbnail, sizes: '256x256', type: 'image/jpeg' },
      ]
    });
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    const handlers = [
      ['play', () => { setIsPlaying(true); audioRef.current?.play().catch(() => {}); }],
      ['pause', () => { setIsPlaying(false); audioRef.current?.pause(); }],
      ['previoustrack', () => playPrev()],
      ['nexttrack', () => playNext()],
      ['seekto', (details) => { if (audioRef.current) audioRef.current.currentTime = details.seekTime; }],
    ];

    for (const [action, handler] of handlers) {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch (e) {}
    }
    return () => {
      for (const [action] of handlers) {
        try { navigator.mediaSession.setActionHandler(action, null); } catch (e) {}
      }
    };
  }, [currentSong, playNext, playPrev, setIsPlaying, isPlaying]);

  // Zero-dependency keyboard shortcut handler
  const handleKeyDown = useCallback((e) => {
    const tag = e.target?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

    const store = useStore.getState();
    const key = e.key;

    switch (key) {
      case ' ':
        e.preventDefault();
        store.setIsPlaying(!store.isPlaying);
        break;
      case 'ArrowRight':
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 5, audioRef.current.duration || 0);
        }
        break;
      case 'ArrowLeft':
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 5, 0);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        store.setVolume(Math.min(store.volume + 0.1, 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        store.setVolume(Math.max(store.volume - 0.1, 0));
        break;
      case 'm':
      case 'M':
        if (store.volume > 0) {
          store.setVolume(0);
        } else {
          store.setVolume(prevVolumeRef.current || 1);
        }
        break;
      case 'l':
      case 'L':
        store.toggleLyricsMode();
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scrubbing Handlers
  const handleSeekStart = () => {
    isScrubbingRef.current = true;
    setIsScrubbing(true);
    setScrubValue(progress);
  };

  const handleSeekChange = (e) => {
    setScrubValue(Number(e.target.value));
  };

  const handleSeekEnd = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = scrubValue;
      setProgress(scrubValue);
    }
    isScrubbingRef.current = false;
    setIsScrubbing(false);
  };

  if (!mounted) return null;

  return (
    <PlayerBar {...{ currentSong, isPlaying, progress: isScrubbing ? scrubValue : progress, duration, isSidebarOpen, shuffle, repeat, volume }}
      onToggleLyrics={toggleLyricsMode}
      onPlayPause={() => setIsPlaying(!isPlaying)}
      onPrev={playPrev}
      onNext={playNext}
      onShuffle={toggleShuffle}
      onRepeat={toggleRepeat}
      onListAdd={() => setLocalAddingToPlaylist(currentSong)}
      onSeekStart={handleSeekStart}
      onSeekChange={handleSeekChange}
      onSeekEnd={handleSeekEnd}
      onVolumeChange={setVolume}
      onToggleMute={() => { if (volume > 0) { setVolume(0); } else { setVolume(prevVolumeRef.current || 1); } }}
    >
      {localAddingToPlaylist && (
        <PlaylistPicker song={localAddingToPlaylist} onClose={() => setLocalAddingToPlaylist(null)} userPlaylists={userPlaylists} addSongToPlaylist={addSongToPlaylist} />
      )}
    </PlayerBar>
  );
}

function PlaylistPicker({ song, onClose, userPlaylists, addSongToPlaylist }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in text-white" onClick={onClose}>
      <div className="bg-[#1c1c1e] border border-white/10 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-black">Quick Save</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-4 overflow-y-auto no-scrollbar max-h-[440px]">
          {userPlaylists.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/40 text-sm mb-4 italic">No mixes found.</p>
              <button onClick={() => { window.location.href = '/playlists'; onClose(); }} className="text-[#fa2d48] font-bold text-sm uppercase tracking-widest">Create Your First Mix</button>
            </div>
          ) : (
            <div className="space-y-2">
              {userPlaylists.map(p => (
                <button key={p.id} onClick={async () => {
                    const result = await addSongToPlaylist(p.id, song);
                    if (result?.error === 'limit_reached') { onClose(); alert(`Premium Required: You've reached the free limit of ${result.limit} songs for this playlist.`); return; }
                    onClose();
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
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function Player() {
  const {
    currentSong,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    playNext,
    playPrev,
    toggleLyricsMode,
    isLyricsMode,
    shuffle,
    toggleShuffle,
    repeat,
    toggleRepeat,
    playlist,
    userPlaylists,
    addSongToPlaylist,
    isSidebarOpen,
    fetchPlaylists,
  } = useStore();

  // Fetch playlists on component mount
  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Listen for auth state changes to refresh playlists after login
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchPlaylists();
    });
    return () => {
      subscription?.unsubscribe?.();
    };
  }, [fetchPlaylists]);

  if (!currentSong) return null;

  return (
    <YTStreamPlayer
      {...{
        currentSong,
        isPlaying,
        setIsPlaying,
        volume,
        setVolume,
        playNext,
        playPrev,
        isSidebarOpen,
        isLyricsMode,
        toggleLyricsMode,
        toggleShuffle,
        shuffle,
        toggleRepeat,
        repeat,
        userPlaylists,
        addSongToPlaylist,
      }}
    />
  );
}
