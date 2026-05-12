'use client';

import { Play, Pause } from 'lucide-react';
import useStore from '../store/useStore';
import { useEffect, useState } from 'react';

export default function Library() {
  const { playlist, setCurrentSong, removeFromPlaylist, currentSong, isPlaying, setIsPlaying } = useStore();
  const [mounted, setMounted] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && playlist.length === 0) {
      setLoadingRecs(true);
      fetch('/api/search?q=top%20hits%202024')
        .then(res => res.json())
        .then(data => { setRecommendations(data.slice(0, 12)); setLoadingRecs(false); })
        .catch(() => setLoadingRecs(false));
    }
  }, [mounted, playlist.length]);

  const playSong = (song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
    }
  };

  if (!mounted) return null;

  if (playlist.length === 0) {
    return (
      <div className="px-6 pb-8">
        <h2 className="text-xl font-bold text-white mb-4">Made For You</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loadingRecs ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-[#181818] p-3 rounded">
                <div className="aspect-square bg-[#282828] rounded mb-2 animate-pulse" />
                <div className="h-3 bg-[#282828] rounded w-3/4 animate-pulse" />
              </div>
            ))
          ) : (
            recommendations.map((song) => (
              <div key={song.id} className="group bg-[#181818] hover:bg-[#282828] rounded p-3 transition-colors cursor-pointer">
                <div className="relative aspect-square rounded mb-2 shadow-lg">
                  <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover rounded" />
                  <button
                    onClick={() => playSong(song)}
                    className="absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center bg-[#1db954] rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                  >
                    <Play size={14} fill="black" className="text-black ml-0.5" />
                  </button>
                </div>
                <h3 className="text-xs font-medium truncate text-white">{song.title}</h3>
                <p className="text-[10px] text-[#b3b3b3] truncate">{song.author}</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-8">
      <h2 className="text-xl font-bold text-white mb-4">Now Playing</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {playlist.map((song) => {
          const isCurrent = currentSong?.id === song.id;
          return (
            <div key={song.id} className="group bg-[#181818] hover:bg-[#282828] rounded p-3 transition-colors cursor-pointer">
              <div className="relative aspect-square rounded mb-2 shadow-lg">
                <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover rounded" />
                <button
                  onClick={() => playSong(song)}
                  className="absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center bg-[#1db954] rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                >
                  {isCurrent && isPlaying ? <Pause size={14} fill="black" className="text-black" /> : <Play size={14} fill="black" className="text-black ml-0.5" />}
                </button>
              </div>
              <h3 className="text-xs font-medium truncate text-white">{song.title}</h3>
              <p className="text-[10px] text-[#b3b3b3] truncate">{song.author}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
