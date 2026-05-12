'use client';

import { Play, Trash2, ListMusic, Upload } from 'lucide-react';
import useStore from '../store/useStore';
import { useEffect, useState } from 'react';

export default function Library() {
  const { playlist, setCurrentSong, removeFromPlaylist, currentSong, addToPlaylist } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const localSong = {
        id: `local-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        author: "Local File",
        thumbnail: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&q=80",
        duration: "Unknown",
        localUrl: url
      };
      addToPlaylist(localSong);
      setCurrentSong(localSong);
    }
  };

  if (!mounted) return null;

  if (playlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-70">
        <ListMusic size={64} className="mb-4 text-primary opacity-50" />
        <h2 className="text-xl font-medium">Your library is empty</h2>
        <p className="text-sm mt-2">Search and add songs to your playlist</p>
        <label className="mt-6 cursor-pointer flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full hover:bg-primary/20 transition-colors">
          <Upload size={18} />
          <span>Import Local MP3</span>
          <input type="file" accept="audio/mp3,audio/*" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <ListMusic size={28} className="text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Your Library</h2>
        </div>
        <label className="cursor-pointer flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full hover:bg-primary/20 transition-colors">
          <Upload size={18} />
          <span className="hidden sm:inline">Import MP3</span>
          <input type="file" accept="audio/mp3,audio/*" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>
      
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {playlist.map((song, index) => {
            const isPlaying = currentSong?.id === song.id;
            
            return (
              <div 
                key={song.id} 
                className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 group ${isPlaying ? 'bg-primary/5' : ''}`}
              >
                <div className="w-8 text-center text-muted-foreground font-medium text-sm">
                  {isPlaying ? (
                    <div className="flex items-end justify-center gap-1 h-4">
                      <div className="w-1 bg-primary animate-pulse h-full rounded-t-sm"></div>
                      <div className="w-1 bg-primary animate-pulse h-2/3 rounded-t-sm" style={{ animationDelay: '150ms'}}></div>
                      <div className="w-1 bg-primary animate-pulse h-4/5 rounded-t-sm" style={{ animationDelay: '300ms'}}></div>
                    </div>
                  ) : (
                    index + 1
                  )}
                </div>
                
                <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0">
                  <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setCurrentSong(song)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]"
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium truncate ${isPlaying ? 'text-primary' : 'text-card-foreground group-hover:text-primary transition-colors'}`}>
                    {song.title}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate">{song.author}</p>
                </div>
                
                <div className="text-sm text-muted-foreground w-16 text-right">
                  {song.duration}
                </div>
                
                <button 
                  onClick={() => removeFromPlaylist(song.id)}
                  className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from playlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
