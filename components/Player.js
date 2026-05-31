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
function PlayerBar({ currentSong, isPlaying, progress, duration, isSidebarOpen, onToggleLyrics, onPlayPause, onPrev, onNext, onShuffle, onRepeat, shuffle, repeat, onListAdd, onSeek, volume, onVolumeChange, onToggleMute, children }) {
  return (
    <div className={`fixed bottom-0 right-0 z-50 bg-[#1c1c1e]/90 backdrop-blur-2xl border-t border-white/5 px-6 py-3 select-none pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 
      ${isSidebarOpen ? 'left-0 lg:left-64' : 'left-0 lg:left-20'}`}>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 lg:hidden overflow-hidden">
        <div className="h-full bg-[#fa2d48] transition-all" style={{ width: `${(progress/(duration||1))*100}%` }} />
        <input type="range" min="0" max={duration || 100} value={progress} onChange={onSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
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
              <button onClick={onPlayPause} className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-all border border-white/5 rounded-full bg-white/5">
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
              <input type="range" min="0" max={duration || 100} value={progress} onChange={onSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
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

// ── Mobile: <audio> player for background playback ────────────
function MobilePlayer({ currentSong, isPlaying, setIsPlaying, volume, setVolume, playNext, playPrev, isSidebarOpen, isLyricsMode, toggleLyricsMode, toggleShuffle, shuffle, toggleRepeat, repeat, userPlaylists, addSongToPlaylist }) {
  const [localAddingToPlaylist, setLocalAddingToPlaylist] = useState(null);
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const progressInterval = useRef(null);
  const currentSongIdRef = useRef(null);
  const isPlayingRef = useRef(false);
  const keepaliveRef = useRef(null);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Load song
  useEffect(() => {
    if (!currentSong) return;
    currentSongIdRef.current = currentSong.id;
    setProgress(0);
    setDuration(0);
    setPlayerReady(false);
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.src = `/api/stream?id=${currentSong.id}`;
    audio.load();
    if (isPlaying) {
      const tryPlay = () => { if (audioRef.current) audioRef.current.play().catch(() => {}); };
      audio.addEventListener('canplay', tryPlay, { once: true });
      audio.addEventListener('loadedmetadata', tryPlay, { once: true });
    }
  }, [currentSong?.id]);

  // Play/pause
  useEffect(() => {
    if (!playerReady || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, playerReady]);

  // Volume
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  // Progress
  useEffect(() => {
    if (!playerReady || !isPlaying || !audioRef.current) return;
    progressInterval.current = setInterval(() => {
      if (!audioRef.current) return;
      const t = audioRef.current.currentTime || 0;
      const d = audioRef.current.duration || 0;
      setProgress(t);
      if (d > 0) setDuration(d);
      if ('mediaSession' in navigator && d > 0) {
        try { navigator.mediaSession.setPositionState({ duration: d, playbackRate: 1, position: t }); } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent('playerTimeUpdate', { detail: { currentTime: t, duration: d } }));
    }, 250);
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [isPlaying, playerReady]);

  // Background keepalive
  useEffect(() => {
    if (!playerReady || !isPlaying) {
      if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null; }
      return;
    }
    keepaliveRef.current = setInterval(() => {
      try {
        if (audioRef.current && isPlayingRef.current && audioRef.current.paused && !audioRef.current.ended) {
          audioRef.current.play().catch(() => {});
        }
      } catch (e) {}
    }, 2000);
    return () => { if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null; } };
  }, [isPlaying, playerReady]);

  // Media Session
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentSong.title, artist: currentSong.author, album: 'SunGeet',
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
      ['play', () => { setIsPlaying(true); audioRef.current?.play().catch(() => {}); }],
      ['pause', () => { setIsPlaying(false); audioRef.current?.pause(); }],
      ['previoustrack', () => playPrev()],
      ['nexttrack', () => playNext()],
      ['seekto', (details) => { if (audioRef.current) audioRef.current.currentTime = details.seekTime; }],
    ];
    for (const [action, handler] of handlers) { try { navigator.mediaSession.setActionHandler(action, handler); } catch (e) {} }
    return () => { for (const [action] of handlers) { try { navigator.mediaSession.setActionHandler(action, null); } catch (e) {} } };
  }, [currentSong, playNext, playPrev, setIsPlaying, isPlaying]);

  // Direct play
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._sunGeetDirectPlay = (songId) => {
        const a = audioRef.current; if (!a) return;
        a.pause(); a.removeAttribute('src');
        a.src = `/api/stream?id=${songId}`; a.load();
        a.play().catch(() => {}); setIsPlaying(true);
      };
    }
  }, [setIsPlaying]);

  const handleSeek = (e) => {
    const t = Number(e.target.value);
    if (audioRef.current) { audioRef.current.currentTime = t; setProgress(t); }
  };

  const toggleMute = () => { if (volume > 0) { setPrevVolume(volume); setVolume(0); } else { setVolume(prevVolume || 1); } };

  return (
    <>
      <audio ref={audioRef} preload="auto" playsInline
        onLoadedMetadata={() => {
          setPlayerReady(true);
          if (audioRef.current) { audioRef.current.volume = volume; setDuration(audioRef.current.duration || 0); }
          if (isPlayingRef.current) audioRef.current?.play().catch(() => {});
        }}
        onEnded={() => {
          if (isPlayingRef.current) {
            const store = useStore.getState();
            if (store.repeat === 'one') { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); } }
            else store.playNext();
          }
        }}
        onError={() => {
          setTimeout(() => {
            if (currentSongIdRef.current) {
              const store = useStore.getState();
              if (store.currentSong?.id === currentSongIdRef.current) store.playNext();
            }
          }, 4000);
        }}
      />
      <PlayerBar {...{ currentSong, isPlaying, progress, duration, isSidebarOpen, shuffle, repeat, volume }}
        onToggleLyrics={toggleLyricsMode}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onPrev={playPrev}
        onNext={playNext}
        onShuffle={toggleShuffle}
        onRepeat={toggleRepeat}
        onListAdd={() => setLocalAddingToPlaylist(currentSong)}
        onSeek={handleSeek}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
      >
        {localAddingToPlaylist && (
          <PlaylistPicker song={localAddingToPlaylist} onClose={() => setLocalAddingToPlaylist(null)} userPlaylists={userPlaylists} addSongToPlaylist={addSongToPlaylist} />
        )}
      </PlayerBar>
    </>
  );
}

// ── Desktop: YouTube IFrame player (original working code) ────
function DesktopPlayer({ currentSong, isPlaying, setIsPlaying, volume, setVolume, playNext, playPrev, isSidebarOpen, isLyricsMode, toggleLyricsMode, toggleShuffle, shuffle, toggleRepeat, repeat, userPlaylists, addSongToPlaylist }) {
  const [localAddingToPlaylist, setLocalAddingToPlaylist] = useState(null);
  const ytPlayerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const [playerReady, setPlayerReady] = useState(false);
  const progressInterval = useRef(null);
  const currentSongIdRef = useRef(null);
  const isPlayingRef = useRef(false);
  const keepaliveRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    if (!mounted) return;
    loadYTApi().then(() => {
      if (ytPlayerRef.current) return;
      const div = document.createElement('div');
      div.id = 'yt-player-hidden';
      div.style.position = 'fixed'; div.style.top = '-9999px'; div.style.left = '-9999px';
      div.style.width = '1px'; div.style.height = '1px'; div.style.opacity = '0'; div.style.pointerEvents = 'none';
      document.body.appendChild(div);
      ytPlayerRef.current = new window.YT.Player('yt-player-hidden', {
        height: '1', width: '1',
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, showinfo: 0, origin: window.location.origin, enablejsapi: 1, playsinline: 1 },
        events: {
          onReady: () => { setPlayerReady(true); if (ytPlayerRef.current) ytPlayerRef.current.setVolume(volume * 100); },
          onStateChange: (event) => {
            const YT = window.YT;
            if (event.data === YT.PlayerState.ENDED) {
              if (isPlayingRef.current) {
                const store = useStore.getState();
                if (store.repeat === 'one') { ytPlayerRef.current.seekTo(0); ytPlayerRef.current.playVideo(); }
                else store.playNext();
              }
            }
            if (event.data === YT.PlayerState.PLAYING) { const dur = ytPlayerRef.current.getDuration(); if (dur) setDuration(dur); }
            if (event.data === YT.PlayerState.CUED) { if (isPlayingRef.current && ytPlayerRef.current) ytPlayerRef.current.playVideo(); }
          },
          onError: () => {},
        },
      });
    });
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [mounted]);

  useEffect(() => {
    if (!playerReady || !ytPlayerRef.current || !currentSong) return;
    if (currentSongIdRef.current !== currentSong.id) {
      currentSongIdRef.current = currentSong.id;
      setProgress(0); setDuration(0);
      ytPlayerRef.current.loadVideoById({ videoId: currentSong.id, startSeconds: 0 });
    }
  }, [currentSong?.id, playerReady]);

  useEffect(() => {
    if (!playerReady || !ytPlayerRef.current) return;
    try {
      const state = ytPlayerRef.current.getPlayerState?.();
      if (isPlaying) { if (state !== 1) ytPlayerRef.current.playVideo(); }
      else { if (state === 1) ytPlayerRef.current.pauseVideo(); }
    } catch (e) {}
  }, [isPlaying, playerReady]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._sunGeetDirectPlay = (songId) => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById({ videoId: songId, startSeconds: 0 });
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
      };
    }
  }, [playerReady, setIsPlaying]);

  useEffect(() => {
    if (!playerReady || !ytPlayerRef.current) return;
    try {
      ytPlayerRef.current.setVolume(volume * 100);
      if (volume === 0) ytPlayerRef.current.mute(); else ytPlayerRef.current.unMute();
    } catch (e) {}
  }, [volume, playerReady]);

  useEffect(() => {
    if (isPlaying && playerReady && ytPlayerRef.current) {
      progressInterval.current = setInterval(() => {
        try {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
            const currentTime = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setProgress(currentTime); if (dur > 0) setDuration(dur);
            if ('mediaSession' in navigator && dur > 0) {
              try { navigator.mediaSession.setPositionState({ duration: dur, playbackRate: 1, position: currentTime }); } catch (e) {}
            }
            window.dispatchEvent(new CustomEvent('playerTimeUpdate', { detail: { currentTime, duration: dur } }));
          }
        } catch (e) {}
      }, 250);
    }
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [isPlaying, playerReady]);

  // Media Session
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentSong.title, artist: currentSong.author, album: 'SunGeet',
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
      ['play', () => { setIsPlaying(true); ytPlayerRef.current?.playVideo(); }],
      ['pause', () => { setIsPlaying(false); ytPlayerRef.current?.pauseVideo(); }],
      ['previoustrack', () => playPrev()],
      ['nexttrack', () => playNext()],
      ['seekbackward', (details) => { const skip = details.seekOffset || 10; const t = Math.max(progress - skip, 0); ytPlayerRef.current?.seekTo(t, true); setProgress(t); }],
      ['seekforward', (details) => { const skip = details.seekOffset || 10; const t = Math.min(progress + skip, duration); ytPlayerRef.current?.seekTo(t, true); setProgress(t); }],
      ['seekto', (details) => { ytPlayerRef.current?.seekTo(details.seekTime, true); setProgress(details.seekTime); }],
    ];
    for (const [action, handler] of handlers) { try { navigator.mediaSession.setActionHandler(action, handler); } catch (e) {} }
    return () => { for (const [action] of handlers) { try { navigator.mediaSession.setActionHandler(action, null); } catch (e) {} } };
  }, [currentSong, playNext, playPrev, setIsPlaying, progress, duration, playerReady, isPlaying]);

  // Background keepalive
  useEffect(() => {
    if (!playerReady || !isPlaying) {
      if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null; }
      return;
    }
    keepaliveRef.current = setInterval(() => {
      try {
        if (ytPlayerRef.current && isPlayingRef.current) {
          const state = ytPlayerRef.current.getPlayerState();
          if (state === 2 || state === 5) ytPlayerRef.current.playVideo();
          if (state === -1) { const song = useStore.getState().currentSong; if (song) ytPlayerRef.current.loadVideoById({ videoId: song.id, startSeconds: 0 }); }
        }
      } catch (e) {}
    }, 2000);
    return () => { if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null; } };
  }, [isPlaying, playerReady]);

  useEffect(() => {
    const lyricsSeekHandler = (e) => { if (playerReady && ytPlayerRef.current && !isNaN(e.detail.time)) { ytPlayerRef.current.seekTo(e.detail.time, true); setProgress(e.detail.time); if (!isPlaying) setIsPlaying(true); } };
    const togglePlayHandler = () => setIsPlaying(!isPlaying);
    const visibilityHandler = () => { if (document.visibilityState === 'visible' && isPlaying && ytPlayerRef.current) { const state = ytPlayerRef.current.getPlayerState(); if (state !== 1) ytPlayerRef.current.playVideo(); } };
    window.addEventListener('lyricsSeek', lyricsSeekHandler);
    window.addEventListener('togglePlay', togglePlayHandler);
    document.addEventListener('visibilitychange', visibilityHandler);
    return () => { window.removeEventListener('lyricsSeek', lyricsSeekHandler); window.removeEventListener('togglePlay', togglePlayHandler); document.removeEventListener('visibilitychange', visibilityHandler); };
  }, [isPlaying, setIsPlaying, playerReady]);

  const handleKeyDown = useCallback((e) => {
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    switch (e.code) {
      case 'Space': e.preventDefault(); setIsPlaying(!isPlaying); break;
      case 'ArrowRight': if (playerReady && ytPlayerRef.current) { const t = Math.min(progress + 5, duration); ytPlayerRef.current.seekTo(t, true); setProgress(t); } break;
      case 'ArrowLeft': if (playerReady && ytPlayerRef.current) { const t = Math.max(progress - 5, 0); ytPlayerRef.current.seekTo(t, true); setProgress(t); } break;
      case 'ArrowUp': e.preventDefault(); setVolume(Math.min(volume + 0.1, 1)); break;
      case 'ArrowDown': e.preventDefault(); setVolume(Math.max(volume - 0.1, 0)); break;
      case 'KeyM': if (volume > 0) { setPrevVolume(volume); setVolume(0); } else { setVolume(prevVolume || 1); } break;
      case 'KeyL': toggleLyricsMode(); break;
    }
  }, [isPlaying, volume, duration, progress, prevVolume, setIsPlaying, setVolume, toggleLyricsMode, playerReady]);
  useEffect(() => { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);

  const handleSeek = (e) => { const t = Number(e.target.value); if (playerReady && ytPlayerRef.current) { ytPlayerRef.current.seekTo(t, true); setProgress(t); } };
  const toggleMute = () => { if (volume > 0) { setPrevVolume(volume); setVolume(0); } else { setVolume(prevVolume || 1); } };

  if (!mounted) return null;

  return (
    <PlayerBar {...{ currentSong, isPlaying, progress, duration, isSidebarOpen, shuffle, repeat, volume }}
      onToggleLyrics={toggleLyricsMode}
      onPlayPause={() => setIsPlaying(!isPlaying)}
      onPrev={playPrev}
      onNext={playNext}
      onShuffle={toggleShuffle}
      onRepeat={toggleRepeat}
      onListAdd={() => setLocalAddingToPlaylist(currentSong)}
      onSeek={handleSeek}
      onVolumeChange={setVolume}
      onToggleMute={toggleMute}
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

// ── Main: choose platform ──────────────────────────────────────
export default function Player() {
  const { currentSong, isPlaying, setIsPlaying, volume, setVolume, playNext, playPrev, toggleLyricsMode, isLyricsMode, shuffle, toggleShuffle, repeat, toggleRepeat, playlist, userPlaylists, addSongToPlaylist, isSidebarOpen } = useStore();
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 1024 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    }
  }, []);

  if (!currentSong) return null;

  if (isMobile) {
    return <MobilePlayer {...{ currentSong, isPlaying, setIsPlaying, volume, setVolume, playNext, playPrev, isSidebarOpen, isLyricsMode, toggleLyricsMode, toggleShuffle, shuffle, toggleRepeat, repeat, userPlaylists, addSongToPlaylist }} />;
  }

  return <DesktopPlayer {...{ currentSong, isPlaying, setIsPlaying, volume, setVolume, playNext, playPrev, isSidebarOpen, isLyricsMode, toggleLyricsMode, toggleShuffle, shuffle, toggleRepeat, repeat, userPlaylists, addSongToPlaylist }} />;
}
