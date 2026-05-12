'use client';

import { useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useOfflineStore from '../../store/offlineStore';
import useStore from '../../store/useStore';
import { Play, Trash2, Library as LibraryIcon, Music } from 'lucide-react';

export default function Library() {
  const { user } = useAuthStore();
  const { offlineTracks, loadOfflineTracks, removeTrackOffline } = useOfflineStore();
  const { setCurrentSong, setPlaylist } = useStore();

  useEffect(() => {
    if (user) {
      loadOfflineTracks();
    }
  }, [user, loadOfflineTracks]);

  const playOfflineTrack = (track) => {
    // When playing offline, we can just set this track to the current song
    // The player will handle retrieving the blob URL since it has an 'isOffline' flag or by checking offline store
    const offlineTrack = { ...track, isOffline: true };
    setPlaylist([offlineTrack]);
    setCurrentSong(offlineTrack);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 px-4">
        <LibraryIcon size={64} className="text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your Library</h2>
        <p className="text-muted-foreground text-center">Please login to view your downloaded music.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
      <div className="flex items-center gap-3 mb-8">
        <LibraryIcon className="text-primary" size={32} />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          My Library
        </h1>
      </div>

      {offlineTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-muted/20 rounded-2xl border border-border/50">
          <Music size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No downloaded music</h3>
          <p className="text-muted-foreground">Download music to listen offline without internet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offlineTracks.map((track) => (
            <div key={track.id} className="group relative bg-card flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
              <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                {track.thumbnail ? (
                  <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={24} className="text-muted-foreground" />
                  </div>
                )}
                <div 
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => playOfflineTrack(track)}
                >
                  <Play className="text-white fill-white" size={24} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate">{track.title}</h4>
                <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
              </div>
              <button 
                onClick={() => removeTrackOffline(track.id)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Remove from library"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
