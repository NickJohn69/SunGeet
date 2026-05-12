'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import useStore from '../store/useStore';

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

export default function Lyrics() {
  const { currentSong, isLyricsMode, toggleLyricsMode } = useStore();
  const [lines, setLines] = useState([]);
  const [plain, setPlain] = useState('');
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    const handler = (e) => setCurrentTime(e.detail.currentTime);
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
        const res = await fetch(`/api/lyrics?title=${encodeURIComponent(currentSong.title || '')}&artist=${encodeURIComponent(currentSong.author || '')}`);
        const data = await res.json();
        if (data.syncedLyrics) setLines(parseLRC(data.syncedLyrics));
        else setPlain(data.lyrics || '');
      } catch { setPlain('Failed to load.'); }
      finally { setLoading(false); }
    };
    fetchLyrics();
  }, [currentSong?.id, isLyricsMode]);

  const seek = (i) => {
    if (i < 0 || i >= lines.length) return;
    window.dispatchEvent(new CustomEvent('lyricsSeek', { detail: { time: lines[i].time } }));
    setActive(i);
  };

  return isLyricsMode && (
    <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-sm">
      <button onClick={toggleLyricsMode} className="absolute top-5 right-5 p-2 rounded-full text-white hover:text-[#1db954] transition-colors">
        <X size={20} />
      </button>
      <div className="h-full max-w-2xl mx-auto pt-16 pb-24 px-6 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center text-[#b3b3b3]">Loading...</div>
        ) : lines.length > 0 ? (
          <div className="py-[45vh] space-y-5">
            {lines.map((line, i) => (
              <p key={i} ref={el => refs.current[i] = el} onClick={() => seek(i)} className={`text-xl font-medium cursor-pointer transition-colors ${i === active ? 'text-[#1db954]' : i < active ? 'text-white/40' : 'text-white/30'}`}>
                {line.text || '· · ·'}
              </p>
            ))}
          </div>
        ) : (
          <div className="py-[45vh] space-y-4">
            {plain.split('\n').map((line, i) => (
              <p key={i} className={`text-xl font-medium ${!line.trim() ? 'h-4' : 'text-white/50'}`}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
