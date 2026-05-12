'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import useStore from '../../store/useStore';
import { Play, Pause } from 'lucide-react';

export default function LibraryPage() {
  const { user } = useAuthStore();
  const { setCurrentSong, setPlaylist, currentSong, isPlaying, setIsPlaying } = useStore();
  const [mounted, setMounted] = useState(false);
  const [tracks, setTracks] = useState([]);

  useEffect(() => { setMounted(true); }, []);

  const play = (track) => {
    if (currentSong?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      const t = { ...track, isOffline: true };
      setPlaylist([t]);
      setCurrentSong(t);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-sm text-[#b3b3b3]">Sign in to view your library</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 pb-24">
      <h2 className="text-xl font-bold text-white mb-5">Your Library</h2>
      {tracks.length === 0 ? (
        <div className="py-12 text-sm text-[#b3b3b3]">No saved tracks</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tracks.map((track) => {
            const isCurrent = currentSong?.id === track.id;
            return (
              <div key={track.id} className="group bg-[#181818] hover:bg-[#282828] rounded p-3 transition-colors cursor-pointer">
                <div className="relative aspect-square rounded mb-2 shadow-lg">
                  <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover rounded" />
                  <button onClick={() => play(track)} className="absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center bg-[#1db954] rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-105">
                    {isCurrent && isPlaying ? <Pause size={14} fill="black" className="text-black" /> : <Play size={14} fill="black" className="text-black ml-0.5" />}
                  </button>
                </div>
                <h3 className="text-xs font-medium truncate text-white">{track.title}</h3>
                <p className="text-[10px] text-[#b3b3b3] truncate">{track.artist}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
