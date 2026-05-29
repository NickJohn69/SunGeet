'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat } from 'lucide-react';
import useStore from '../store/useStore';
import useAuthStore from '../store/authStore';
import PremiumGuard from './PremiumGuard';

const parseLRC = (str) => {
  if (!str) return [];
  const lines = str.split('\n');
  const parsed = [];
  const regex = /\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\]/;
  lines.forEach(line => {
    const m = line.match(regex);
    if (m) {
      const time = parseInt(m[1]) * 60 + parseFloat(m[2]);
      const text = line.replace(regex, '').trim();
      parsed.push({ time, text });
    }
  });
  return parsed;
};

const formatTime = (time) => {
  if (!time || isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function Lyrics() {
  const { 
    currentSong, isLyricsMode, toggleLyricsMode, isPlaying, setIsPlaying, 
    playNext, playPrev, volume, setVolume, shuffle, toggleShuffle, repeat, toggleRepeat,
    isSidebarOpen
  } = useStore();
  
  const [lines, setLines] = useState([]);
  const [plain, setPlain] = useState('');
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    const handler = (e) => {
      setCurrentTime(e.detail.currentTime);
      if (e.detail.duration) setDuration(e.detail.duration);
    };
    window.addEventListener('playerTimeUpdate', handler);
    return () => window.removeEventListener('playerTimeUpdate', handler);
  }, []);

  useEffect(() => {
    if (!isLyricsMode || !lines.length) return;
    let low = 0, high = lines.length - 1, res = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lines[mid].time <= currentTime) { res = mid; low = mid + 1; }
      else high = mid - 1;
    }
    setActive(prev => prev !== res ? res : prev);
  }, [currentTime, isLyricsMode, lines]);

  useEffect(() => {
    if (active >= 0 && refs.current[active]) {
      refs.current[active].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [active]);

  useEffect(() => {
    const fetchLyrics = async () => {
      if (!currentSong || !isLyricsMode) return;
      setLoading(true);
      setLines([]);
      setPlain('');
      setActive(-1);
      setCurrentTime(0);
      try {
        const res = await fetch(`/api/lyrics?title=${encodeURIComponent(currentSong.title || '')}&artist=${encodeURIComponent(currentSong.author || '')}&duration=${currentSong.durationSeconds || 0}`);
        const data = await res.json();
        if (data.syncedLyrics) setLines(parseLRC(data.syncedLyrics));
        else setPlain(data.lyrics || 'No lyrics available.');
      } catch { setPlain('No lyrics available.'); }
      finally { setLoading(false); }
    };
    fetchLyrics();
  }, [currentSong?.id, isLyricsMode]);

  const seek = (i) => {
    if (i < 0 || i >= lines.length) return;
    window.dispatchEvent(new CustomEvent('lyricsSeek', { detail: { time: lines[i].time } }));
    setActive(i);
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    window.dispatchEvent(new CustomEvent('lyricsSeek', { detail: { time } }));
  };

  const { userPlan } = useAuthStore();
  const [showGuard, setShowGuard] = useState(false);

  useEffect(() => {
    if (isLyricsMode && userPlan !== 'premium') {
      setShowGuard(true);
      // We don't actually toggle off lyrics mode automatically to show the guard
    } else {
      setShowGuard(false);
    }
  }, [isLyricsMode, userPlan]);


  
  if (!isLyricsMode) return null;

  const isPremium = userPlan === 'premium';

  return (
    <div className={`fixed inset-y-0 right-0 z-[60] overflow-hidden animate-fade-in bg-black transition-all duration-500 
      ${isSidebarOpen ? 'left-0 lg:left-64' : 'left-0 lg:left-20'}`}>
      {/* Premium Guard for Synced Lyrics specifically */}
      {!isPremium && showGuard && (
        <PremiumGuard 
          isOpen={showGuard} 
          onClose={() => setShowGuard(false)} 
          featureName="Real-time Lyrics" 
        />
      )}
      {/* Blurred Background Filtered */}
      <div className="absolute inset-0 z-0">
        <img 
          src={currentSong?.thumbnail} 
          alt="" 
          className="w-full h-full object-cover scale-125 blur-[120px] opacity-40 brightness-[0.3]"
        />
      </div>

      {/* Header with Close */}
      <div className="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-8 z-50">
         <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fa2d48]">Playing from SunGeet</span>
            <span className="text-white/40 text-xs font-bold truncate max-w-[200px]">{currentSong?.title}</span>
         </div>
         <button 
           onClick={toggleLyricsMode} 
           className="w-10 h-10 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center border border-white/5 active:scale-90"
         >
           <X size={20} />
         </button>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center md:items-stretch overflow-hidden">
        
        {/* Left Aspect: Minimal Artwork & Controls */}
        <div className="w-full flex-shrink-0 h-[70vh] md:h-full md:w-[45%] flex flex-col justify-center items-center px-8 lg:px-16 pt-16 md:pt-24 pb-8 md:pb-12 overflow-y-auto no-scrollbar">
          <div className="w-[200px] h-[200px] md:w-full md:max-w-[320px] md:aspect-square rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] mb-8 md:mb-10 group selection:bg-none flex-shrink-0">
            <img 
              src={currentSong?.thumbnail} 
              alt={currentSong?.title} 
              className="w-full h-full object-cover" 
            />
          </div>
          
          <div className="w-full max-w-[320px] mb-8">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight truncate">
              {currentSong?.title}
            </h2>
            <p className="text-sm md:text-base font-bold text-white/30 truncate mt-1">
              {currentSong?.author}
            </p>
          </div>

          {/* Scrubber */}
          <div className="w-full max-w-[320px] space-y-3 mb-10 group/scrub">
            <div className="relative h-1 flex items-center">
               <input 
                 type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
               />
               <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all" style={{ width: `${(currentTime/(duration||1))*100}%` }} />
               </div>
               <div 
                className="absolute w-2 h-2 bg-white rounded-full shadow-lg opacity-0 group-hover/scrub:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 4px)` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black tabular-nums text-white/20 uppercase tracking-[0.2em]">
               <span>{formatTime(currentTime)}</span>
               <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Grid */}
          <div className="w-full max-w-[320px] flex items-center justify-between">
            <button 
              onClick={toggleShuffle}
              className={`transition-colors ${shuffle ? 'text-[#fa2d48]' : 'text-white/20 hover:text-white'}`}
            >
              <Shuffle size={18} />
            </button>
            <div className="flex items-center gap-8">
              <button 
                onClick={playPrev}
                className="text-white/40 hover:text-white transition-all transform active:scale-90"
              >
                <SkipBack size={28} fill="currentColor" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-all shadow-xl active:scale-95"
              >
                {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
              </button>
              <button 
                onClick={playNext}
                className="text-white/40 hover:text-white transition-all transform active:scale-90"
              >
                <SkipForward size={28} fill="currentColor" />
              </button>
            </div>
            <button 
              onClick={toggleRepeat}
              className={`transition-colors relative ${repeat !== 'none' ? 'text-[#fa2d48]' : 'text-white/20 hover:text-white'}`}
            >
              <Repeat size={18} />
              {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
            </button>
          </div>

          {/* Volume for aesthetic perfection */}
          <div className="w-full max-w-[320px] mt-12 flex items-center gap-4 group/vol">
             <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-white/20 group-hover/vol:text-white transition-colors">
                {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
             </button>
             <div className="flex-1 relative h-1 flex items-center">
                <input 
                  type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-white/20 group-hover/vol:bg-white/60 transition-colors" style={{ width: `${volume*100}%` }} />
                </div>
             </div>
          </div>
        </div>

        {/* Right Aspect: Minimal Lyrics / Premium Placeholder */}
        <div className="w-full flex-shrink-0 h-[30vh] md:h-full md:flex-1 overflow-y-auto no-scrollbar md:pt-[40vh] md:pb-[45vh] px-8 md:px-0">
          <div className="max-w-[500px]">
            {!isPremium ? (
              <div className="flex flex-col items-start justify-center h-full py-20 px-4">
                 <h2 className="text-4xl font-black text-white mb-6">Experience the magic of lyrics.</h2>
                 <p className="text-xl font-bold text-white/40 mb-10 leading-relaxed">Upgrade to Premium to view real-time synchronized lyrics and follow along with your favorite tracks.</p>
                 <button 
                   onClick={() => { toggleLyricsMode(); window.location.href = '/plans'; }}
                   className="px-10 py-4 bg-[#fa2d48] rounded-full font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(250,45,72,0.3)] hover:scale-105 active:scale-95 transition-all"
                 >
                   Unlock Lyrics
                 </button>
              </div>
            ) : loading ? (
              <div className="py-20 opacity-20">
                 <div className="h-8 w-64 bg-white/60 rounded animate-pulse mb-6" />
                 <div className="h-8 w-48 bg-white/60 rounded animate-pulse mb-6" />
                 <div className="h-8 w-72 bg-white/60 rounded animate-pulse" />
              </div>
            ) : lines.length > 0 ? (
              <div className="space-y-12">
                {lines.map((line, i) => {
                  const isActive = i === active;
                  return (
                    <p 
                      key={i} 
                      ref={el => refs.current[i] = el} 
                      onClick={() => seek(i)} 
                      className={`text-2xl md:text-4xl font-black cursor-pointer transition-all duration-700 leading-tight origin-left
                        ${isActive 
                          ? 'text-white scale-100 opacity-100 blur-0' 
                          : 'text-white/30 opacity-40 hover:opacity-100'
                        }`}
                    >
                      {line.text || '· · ·'}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6 opacity-40">
                {plain.split('\n').map((line, i) => (
                  <p key={i} className="text-xl font-bold transition-all duration-300">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
