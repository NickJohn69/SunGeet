'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic2 } from 'lucide-react';
import useStore from '../store/useStore';

const formatTime = (time) => {
  if (!time || isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function Player() {
  const { currentSong, isPlaying, setIsPlaying, volume, setVolume, playNext, playPrev, toggleLyricsMode, isLyricsMode } = useStore();
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    const audio = audioRef.current;
    audio.currentTime = 0;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {});
    }
  }, [currentSong?.id]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
      window.dispatchEvent(new CustomEvent('playerTimeUpdate', { detail: { currentTime: audioRef.current.currentTime } }));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (audioRef.current && !isNaN(e.detail.time)) {
        audioRef.current.currentTime = e.detail.time;
        setProgress(e.detail.time);
        if (!isPlaying) setIsPlaying(true);
      }
    };
    window.addEventListener('lyricsSeek', handler);
    return () => window.removeEventListener('lyricsSeek', handler);
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

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;
  const audioSrc = currentSong.localUrl || `/api/stream?id=${currentSong.id}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#181818] border-t border-[#282828]">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={playNext}
        autoPlay
      />

      <div className="h-1 bg-[#535353]">
        <div className="h-full bg-[#1db954]" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="grid grid-cols-3 items-center h-14 px-4">
        <div className="flex items-center gap-3">
          <img src={currentSong.thumbnail} alt={currentSong.title} className="w-10 h-10 rounded-sm" />
          <div className="min-w-0">
            <p className="text-xs text-white truncate">{currentSong.title}</p>
            <p className="text-[10px] text-[#b3b3b3] truncate">{currentSong.author}</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-5">
            <button onClick={playPrev} className="text-[#b3b3b3] hover:text-white"><SkipBack size={16} /></button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-7 h-7 flex items-center justify-center bg-white rounded-full hover:scale-105">
              {isPlaying ? <Pause size={14} fill="black" className="text-black" /> : <Play size={14} fill="black" className="text-black ml-0.5" />}
            </button>
            <button onClick={playNext} className="text-[#b3b3b3] hover:text-white"><SkipForward size={16} /></button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-sm mt-0.5">
            <span className="text-[10px] text-[#b3b3b3] w-7 text-right">{formatTime(progress)}</span>
            <input type="range" min="0" max={duration || 100} value={progress} onChange={handleSeek} className="flex-1" />
            <span className="text-[10px] text-[#b3b3b3] w-7">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={toggleLyricsMode} className={`p-1 ${isLyricsMode ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'}`}>
            <Mic2 size={14} />
          </button>
          <button onClick={toggleMute} className="text-[#b3b3b3] hover:text-white">
            {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-16" />
        </div>
      </div>
    </div>
  );
}
