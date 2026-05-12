'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Loader2, Music2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';

/**
 * Parse LRC-format synced lyrics into structured data.
 * Handles timestamps like [00:20.04], [01:30.123], etc.
 */
const parseSyncedLyrics = (lrcStr) => {
  if (!lrcStr) return [];
  const lines = lrcStr.split('\n');
  const parsed = [];
  const timeRegex = /\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\]/;
  
  lines.forEach(line => {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const time = minutes * 60 + seconds;
      const text = line.replace(timeRegex, '').trim();
      parsed.push({ time, text });
    }
  });

  return parsed;
};

/**
 * Find the active lyric index for a given playback time.
 * Uses binary search for efficiency with large lyric sets.
 */
const findActiveIndex = (syncedLines, currentTime) => {
  if (!syncedLines.length) return -1;
  
  let low = 0;
  let high = syncedLines.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (syncedLines[mid].time <= currentTime) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
};

export default function Lyrics() {
  const { currentSong, isLyricsMode, toggleLyricsMode } = useStore();
  const [lyrics, setLyrics] = useState('');
  const [syncedLines, setSyncedLines] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [lyricsSource, setLyricsSource] = useState(null);
  const [matchInfo, setMatchInfo] = useState(null);
  const containerRef = useRef(null);
  const lineRefs = useRef([]);
  const lastScrollTime = useRef(0);

  // Fetch lyrics when song or lyrics mode changes
  useEffect(() => {
    const fetchLyrics = async () => {
      if (!currentSong) return;
      
      setLoading(true);
      setLyrics('');
      setSyncedLines([]);
      setActiveIndex(-1);
      setLyricsSource(null);
      setMatchInfo(null);
      
      try {
        // Build query with duration for better lrclib matching
        const params = new URLSearchParams({
          title: currentSong.title || '',
          artist: currentSong.author || '',
        });
        
        // Include duration in seconds if available
        if (currentSong.durationSeconds && currentSong.durationSeconds > 0) {
          params.set('duration', currentSong.durationSeconds.toString());
        }

        const res = await fetch(`/api/lyrics?${params.toString()}`);
        const data = await res.json();
        
        if (data.syncedLyrics) {
          const parsed = parseSyncedLyrics(data.syncedLyrics);
          setSyncedLines(parsed);
          setLyricsSource(data.source);
          if (data.matchedArtist || data.matchedTrack) {
            setMatchInfo({ artist: data.matchedArtist, track: data.matchedTrack });
          }
        } else {
          setLyrics(data.lyrics || "Lyrics not found.");
          setLyricsSource(data.source);
        }
      } catch (error) {
        console.error("Lyrics error:", error);
        setLyrics("Failed to load lyrics.");
      } finally {
        setLoading(false);
      }
    };

    if (isLyricsMode) {
      fetchLyrics();
    }
  }, [currentSong, isLyricsMode]);

  // Smooth scroll to the active line
  const scrollToLine = useCallback((index) => {
    const now = Date.now();
    // Throttle scrolling to prevent jitter (min 200ms between scrolls)
    if (now - lastScrollTime.current < 200) return;
    
    if (index >= 0 && lineRefs.current[index] && containerRef.current) {
      const container = containerRef.current;
      const element = lineRefs.current[index];
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // Calculate target scroll position to center the active line
      const targetScrollTop = element.offsetTop - container.offsetTop - (containerRect.height / 2) + (elementRect.height / 2);
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
      
      lastScrollTime.current = now;
    }
  }, []);

  // Listen for time updates from the Player component
  useEffect(() => {
    if (!isLyricsMode || syncedLines.length === 0) return;

    const handleTimeUpdate = (e) => {
      const currentTime = e.detail.currentTime;
      const newActiveIndex = findActiveIndex(syncedLines, currentTime);
      
      setActiveIndex((prev) => {
        if (prev !== newActiveIndex) {
          scrollToLine(newActiveIndex);
          return newActiveIndex;
        }
        return prev;
      });
    };

    window.addEventListener('playerTimeUpdate', handleTimeUpdate);
    return () => window.removeEventListener('playerTimeUpdate', handleTimeUpdate);
  }, [isLyricsMode, syncedLines, scrollToLine]);

  // Handle clicking on a lyric line to seek
  const handleLineClick = (index) => {
    if (index < 0 || index >= syncedLines.length) return;
    const targetTime = syncedLines[index].time;
    
    // Dispatch a custom event for the Player to handle seeking
    window.dispatchEvent(new CustomEvent('lyricsSeek', {
      detail: { time: targetTime }
    }));
    
    setActiveIndex(index);
  };

  return (
    <AnimatePresence>
      {isLyricsMode && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-40 overflow-hidden"
        >
          {/* Blurred Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-60 dark:opacity-40"
            style={{ 
              backgroundImage: currentSong ? `url(${currentSong.thumbnail})` : 'none',
            }}
          />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-3xl dark:bg-background/80" />

          {/* Content */}
          <div className="relative h-full flex flex-col p-8 pt-20 pb-32">
            {/* Close Button */}
            <button 
              onClick={toggleLyricsMode}
              className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full transition-colors text-foreground backdrop-blur-md z-10"
            >
              <X size={24} />
            </button>

            <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-12 overflow-hidden">
              {/* Cover Art (Left side on desktop) */}
              <div className="hidden md:flex flex-col justify-center items-center w-1/3 min-w-[300px]">
                <motion.img 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  src={currentSong?.thumbnail} 
                  alt={currentSong?.title} 
                  className="w-full aspect-square object-cover rounded-2xl shadow-2xl"
                />
                <div className="mt-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground">{currentSong?.title}</h2>
                  <p className="text-lg text-muted-foreground mt-2">{currentSong?.author}</p>
                  {/* Show matched info if different from displayed */}
                  {matchInfo && (
                    <p className="text-xs text-muted-foreground/60 mt-3 flex items-center justify-center gap-1">
                      <Music2 size={12} />
                      Synced: {matchInfo.artist} — {matchInfo.track}
                    </p>
                  )}
                </div>
              </div>

              {/* Lyrics Scroll Area */}
              <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto pl-6 pr-4 scroll-smooth pb-40 relative lyrics-scroll-container"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="text-xl">Finding lyrics...</p>
                    <p className="text-sm mt-2 text-muted-foreground/60">Searching LRCLIB for synced lyrics</p>
                  </div>
                ) : (
                  <div className="py-[30vh] flex flex-col gap-6 items-center md:items-start text-center md:text-left">
                    {syncedLines.length > 0 ? (
                      syncedLines.map((line, i) => {
                        const isActive = i === activeIndex;
                        const isPast = i < activeIndex;
                        const isInstrumental = !line.text.trim();
                        
                        return (
                          <motion.p 
                            key={i}
                            ref={(el) => (lineRefs.current[i] = el)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.02, 0.5) }}
                            className={`text-2xl md:text-4xl font-bold transition-all duration-500 ease-out cursor-pointer select-none
                              ${isInstrumental ? 'h-6 flex items-center' : ''}
                              ${isActive 
                                ? 'text-white scale-[1.03] drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                                : isPast 
                                  ? 'text-white/50 hover:text-white/70' 
                                  : 'text-foreground/25 hover:text-foreground/40'}
                            `}
                            onClick={() => handleLineClick(i)}
                            style={{
                              transform: isActive ? 'scale(1.03)' : 'scale(1)',
                              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            {isInstrumental ? (
                              isActive ? (
                                <span className="flex items-center gap-2 text-white/70 text-base">
                                  <Music2 size={16} className="animate-pulse" />
                                  <span className="flex gap-1">
                                    <span className="inline-block w-1 h-3 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="inline-block w-1 h-5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="inline-block w-1 h-3 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    <span className="inline-block w-1 h-4 bg-white/55 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                                  </span>
                                </span>
                              ) : (
                                <span className="text-foreground/15 text-base">• • •</span>
                              )
                            ) : (
                              line.text
                            )}
                          </motion.p>
                        );
                      })
                    ) : (
                      // Plain (unsynced) lyrics fallback
                      lyrics.split('\n').map((line, i) => (
                        <motion.p 
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.05, 2) }}
                          className={`text-2xl md:text-4xl font-bold transition-all duration-500
                            ${!line.trim() ? 'h-4' : 'text-foreground/70'}
                          `}
                        >
                          {line}
                        </motion.p>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
