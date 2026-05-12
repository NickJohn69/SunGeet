import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      currentSong: null,
      playlist: [],
      isPlaying: false,
      volume: 1,
      theme: 'dark',
      isLyricsMode: false,
      
      setCurrentSong: (song) => set({ currentSong: song, isPlaying: true }),
      setPlaylist: (list) => set({ playlist: list }),
      addToPlaylist: (song) => set((state) => {
        if (!state.playlist.find(s => s.id === song.id)) {
          return { playlist: [...state.playlist, song] };
        }
        return state;
      }),
      removeFromPlaylist: (id) => set((state) => ({
        playlist: state.playlist.filter((s) => s.id !== id)
      })),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setVolume: (vol) => set({ volume: vol }),
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        if (typeof document !== 'undefined') {
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return { theme: newTheme };
      }),
      setTheme: (theme) => set(() => {
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return { theme };
      }),
      toggleLyricsMode: () => set((state) => ({ isLyricsMode: !state.isLyricsMode })),
      playNext: () => {
        const { currentSong, playlist } = get();
        if (!currentSong || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
        if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
          set({ currentSong: playlist[currentIndex + 1], isPlaying: true });
        }
      },
      playPrev: () => {
        const { currentSong, playlist } = get();
        if (!currentSong || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(s => s.id === currentSong.id);
        if (currentIndex > 0) {
          set({ currentSong: playlist[currentIndex - 1], isPlaying: true });
        }
      }
    }),
    {
      name: 'music-player-storage',
      partialize: (state) => ({
        playlist: state.playlist,
        theme: state.theme,
        volume: state.volume
      }),
    }
  )
);

export default useStore;
