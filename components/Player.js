'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Download, Mic2, Shuffle, Repeat, CheckCircle
} from 'lucide-react';
import useStore from '../store/useStore';
import useOfflineStore from '../store/offlineStore';
import useAuthStore from '../store/authStore';

const formatTime = (time) => {
  if (!time || isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function Player() {
  const { currentSong, isPlaying, setIsPlaying, volume, setVolume, playNext, playPrev, toggleLyricsMode, isLyricsMode } = useStore();
  const { saveTrackOffline, getTrackUrl } = useOfflineStore();
  const { user } = useAuthStore();
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [offlineUrl, setOfflineUrl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fetchOfflineUrl = async () => {
      if (currentSong?.isOffline) {
        const url = await getTrackUrl(currentSong.id);
        setOfflineUrl(url);
      } else {
        setOfflineUrl(null);
      }
    };
    fetchOfflineUrl();
  }, [currentSong, getTrackUrl]);

  const audioSrc = currentSong
    ? (currentSong.isOffline ? offlineUrl : (currentSong.localUrl || `/api/stream?id=${currentSong.id}`))
    : null;

  useEffect(() => {
    if (audioRef.current && audioSrc) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          if (e.name !== 'AbortError' && e.name !== 'NotSupportedError') {
            console.error('Playback error:', e);
          }
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioSrc]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
      window.dispatchEvent(new CustomEvent('playerTimeUpdate', {
        detail: { currentTime: audioRef.current.currentTime, duration: audioRef.current.duration }
      }));
    }
  };

  // Lyrics seek
  useEffect(() => {
    const handleLyricsSeek = (e) => {
      const t = e.detail.time;
      if (audioRef.current && !isNaN(t)) {
        audioRef.current.currentTime = t;
        setProgress(t);
        if (!isPlaying) setIsPlaying(true);
      }
    };
    window.addEventListener('lyricsSeek', handleLyricsSeek);
    return () => window.removeEventListener('lyricsSeek', handleLyricsSeek);
  }, [isPlaying, setIsPlaying]);

  // ─── Keyboard Shortcuts ────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    // Ignore if user is typing in an input/textarea
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        setIsPlaying(!isPlaying);
        break;
      case 'ArrowRight':
        if (e.shiftKey) {
          e.preventDefault();
          playNext();
        } else if (audioRef.current) {
          e.preventDefault();
          audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 5, duration);
        }
        break;
      case 'ArrowLeft':
        if (e.shiftKey) {
          e.preventDefault();
          playPrev();
        } else if (audioRef.current) {
          e.preventDefault();
          audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 5, 0);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(Math.min(volume + 0.1, 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(Math.max(volume - 0.1, 0));
        break;
      case 'KeyM':
        e.preventDefault();
        if (volume > 0) {
          setPrevVolume(volume);
          setVolume(0);
        } else {
          setVolume(prevVolume || 1);
        }
        break;
      case 'KeyL':
        e.preventDefault();
        toggleLyricsMode();
        break;
      default:
        break;
    }
  }, [isPlaying, volume, duration, prevVolume, setIsPlaying, setVolume, playNext, playPrev, toggleLyricsMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  // ──────────────────────────────────────────────────────────────────────────

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 1);
    }
  };

  const handleDownload = async () => {
    if (!currentSong) return;
    if (!user) { alert('Please login to save music to your account.'); return; }
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/download?id=${currentSong.id}&title=${encodeURIComponent(currentSong.title)}`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const success = await saveTrackOffline(currentSong, blob);
      if (success) alert('Saved to your offline library!');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to save track for offline play.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!mounted || !currentSong) return null;

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 liquid-glass">
      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={playNext}
        autoPlay
      />

      {/* ── Full-width progress bar (top of player, touch-friendly) ── */}
      <div className="relative w-full h-1 bg-border/60 group cursor-pointer">
        <div
          className="absolute left-0 top-0 h-full bg-primary transition-all duration-150"
          style={{ width: `${progressPct}%` }}
        />
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={progress}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ margin: 0 }}
        />
      </div>

      {/* ── Mobile layout ─────────────────────────────────────────── */}
      <div className="md:hidden px-3 py-2">
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <img
            src={currentSong.thumbnail}
            alt={currentSong.title}
            className="w-10 h-10 rounded-md object-cover shadow flex-shrink-0"
          />

          {/* Title + artist — scrolling marquee on small screens */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{currentSong.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentSong.author || 'Unknown Artist'}</p>
          </div>

          {/* Mobile controls: prev / play-pause / next */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={playPrev}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:scale-105 active:scale-95 transition-transform shadow-md"
            >
              {isPlaying
                ? <Pause size={18} fill="currentColor" />
                : <Play size={18} fill="currentColor" className="ml-0.5" />
              }
            </button>
            <button
              onClick={playNext}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipForward size={18} />
            </button>

            {/* Lyrics toggle on mobile too */}
            <button
              onClick={toggleLyricsMode}
              className={`w-8 h-8 flex items-center justify-center transition-colors ${isLyricsMode ? 'text-primary' : 'text-muted-foreground'}`}
              title="Lyrics (L)"
            >
              <Mic2 size={16} />
            </button>
          </div>
        </div>

        {/* Time indicators */}
        <div className="flex justify-between text-[10px] text-muted-foreground/70 mt-1 px-0.5">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── Desktop layout ────────────────────────────────────────── */}
      <div className="hidden md:flex items-center max-w-7xl mx-auto px-4 py-3 gap-4">

        {/* Track Info */}
        <div className="flex items-center gap-3 w-1/4 min-w-0">
          <img
            src={currentSong.thumbnail}
            alt={currentSong.title}
            className="w-12 h-12 rounded-md object-cover shadow-lg flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-foreground leading-snug">{currentSong.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentSong.author || 'Unknown Artist'}</p>
          </div>
        </div>

        {/* Center controls */}
        <div className="flex flex-col items-center flex-1 min-w-0 max-w-2xl mx-auto">
          <div className="flex items-center gap-5 mb-1">
            <button className="text-muted-foreground hover:text-foreground transition-colors" title="Shuffle">
              <Shuffle size={16} />
            </button>
            <button onClick={playPrev} className="text-muted-foreground hover:text-foreground transition-colors" title="Previous (Shift+←)">
              <SkipBack size={20} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg"
              title="Play/Pause (Space)"
            >
              {isPlaying
                ? <Pause size={18} fill="currentColor" />
                : <Play size={18} fill="currentColor" className="ml-0.5" />
              }
            </button>
            <button onClick={playNext} className="text-muted-foreground hover:text-foreground transition-colors" title="Next (Shift+→)">
              <SkipForward size={20} />
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors" title="Repeat">
              <Repeat size={16} />
            </button>
          </div>

          {/* Seek bar with times */}
          <div className="w-full flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-9 text-right tabular-nums">{formatTime(progress)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="flex-1"
              title="Seek (← / →)"
            />
            <span className="w-9 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-0">
          <button
            onClick={toggleLyricsMode}
            className={`transition-colors ${isLyricsMode ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            title="Lyrics (L)"
          >
            <Mic2 size={17} />
          </button>

          {!currentSong.localUrl && !currentSong.isOffline && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`${isDownloading ? 'text-primary animate-pulse' : 'text-muted-foreground hover:text-primary'} transition-colors`}
              title="Save to Library"
            >
              <Download size={17} />
            </button>
          )}

          {currentSong.isOffline && (
            <div className="text-primary" title="Available Offline">
              <CheckCircle size={17} />
            </div>
          )}

          {/* Volume */}
          <div className="flex items-center gap-2 group">
            <button
              onClick={toggleMute}
              className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0"
              title="Mute/Unmute (M)"
            >
              {volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20"
              title="Volume (↑ / ↓)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
