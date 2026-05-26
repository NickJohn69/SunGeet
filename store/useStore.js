import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

const useStore = create(
  persist(
    (set, get) => ({
      currentSong: null,
      playlist: [], // This acts as the active playback queue
      isPlaying: false,
      volume: 1,
      theme: 'dark',
      isLyricsMode: false,
      shuffle: false,
      repeat: 'none', // none, one, all
      userPlaylists: [],
      isSidebarOpen: false, // Default to false for better mobile-first behavior
      
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleLyricsMode: () => set((state) => ({ isLyricsMode: !state.isLyricsMode })),
      
      setCurrentSong: (song) => set({ currentSong: song, isPlaying: true }),
      setPlaylist: (list) => set({ playlist: list }),
      
      clearStore: () => set({ 
        userPlaylists: [], 
        playlist: [], 
        currentSong: null, 
        isPlaying: false 
      }),
      
      // Playlist Management
      fetchPlaylists: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.warn("No user session found for fetching playlists.");
            return;
          }
          
          const { data, error } = await supabase
            .from('playlists')
            .select('*, playlist_songs(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          set({ userPlaylists: data });
        } catch (err) {
          console.error("Error fetching playlists:", err.message);
        }
      },
      
      createPlaylist: async (name) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            alert("Please log in to create a playlist.");
            return null;
          }
          
          // Check limits for non-premium users
          const { userPlan } = (await import('./authStore')).default.getState();
          if (userPlan !== 'premium' && get().userPlaylists.length >= 3) {
            return { error: 'limit_reached', feature: 'Playlists', limit: 3 };
          }
          
          const { data, error } = await supabase
            .from('playlists')
            .insert([{ name, user_id: user.id }])
            .select()
            .single();
            
          if (error) throw error;
          
          const newPlaylist = { ...data, playlist_songs: [] };
          set((state) => ({ userPlaylists: [newPlaylist, ...state.userPlaylists] }));
          return newPlaylist;
        } catch (err) {
          console.error("Error creating playlist:", err.message);
          return null;
        }
      },
      
      deletePlaylist: async (id) => {
        const { error } = await supabase.from('playlists').delete().eq('id', id);
        if (!error) set((state) => ({ userPlaylists: state.userPlaylists.filter(p => p.id !== id) }));
      },

      addSongToPlaylist: async (playlistId, song) => {
        const { userPlan } = (await import('./authStore')).default.getState();
        const playlist = get().userPlaylists.find(p => p.id === playlistId);
        
        if (userPlan !== 'premium' && playlist?.playlist_songs?.length >= 10) {
          return { error: 'limit_reached', feature: 'Songs per Playlist', limit: 10 };
        }

        const { data: currentPlaylistSongs } = await supabase
          .from('playlist_songs')
          .select('order_index')
          .eq('playlist_id', playlistId)
          .order('order_index', { ascending: false })
          .limit(1);
          
        const nextOrder = (currentPlaylistSongs?.[0]?.order_index ?? -1) + 1;
        
        const { error } = await supabase.from('playlist_songs').insert([{
          playlist_id: playlistId,
          song_id: song.id,
          title: song.title,
          author: song.author,
          thumbnail: song.thumbnail,
          order_index: nextOrder
        }]);
        
        if (!error) get().fetchPlaylists();
        return { success: true };
      },

      removeSongFromPlaylist: async (playlistId, songId) => {
        const { error } = await supabase
          .from('playlist_songs')
          .delete()
          .match({ playlist_id: playlistId, song_id: songId });
          
        if (!error) get().fetchPlaylists();
      },

      // Sorting logic
      sortPlaylist: (playlistId, criteria) => {
        const { userPlaylists } = get();
        const playlist = userPlaylists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        let sortedSongs = [...playlist.playlist_songs];
        if (criteria === 'name') {
          sortedSongs.sort((a, b) => a.title.localeCompare(b.title));
        } else if (criteria === 'date') {
          sortedSongs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        
        const updatedPlaylists = userPlaylists.map(p => 
          p.id === playlistId ? { ...p, playlist_songs: sortedSongs } : p
        );
        set({ userPlaylists: updatedPlaylists });
      },

      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      
      toggleRepeat: () => set((state) => {
        const order = ['none', 'one', 'all'];
        const next = order[(order.indexOf(state.repeat) + 1) % order.length];
        return { repeat: next };
      }),
      
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
      
      playNext: () => {
        const { currentSong, playlist, shuffle, repeat } = get();
        if (playlist.length === 0) return;
        
        let nextSong;
        if (shuffle) {
          const randomIndex = Math.floor(Math.random() * playlist.length);
          nextSong = playlist[randomIndex];
        } else {
          const currentIndex = playlist.findIndex(s => s.id === (currentSong?.id || ''));
          if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
            nextSong = playlist[currentIndex + 1];
          } else if (repeat === 'all') {
            nextSong = playlist[0];
          }
        }
        
        if (nextSong) {
          set({ currentSong: nextSong, isPlaying: true });
        }
      },
      
      playPrev: () => {
        const { currentSong, playlist, shuffle } = get();
        if (playlist.length === 0) return;
        
        let prevSong;
        if (shuffle) {
          const randomIndex = Math.floor(Math.random() * playlist.length);
          prevSong = playlist[randomIndex];
        } else {
          const currentIndex = playlist.findIndex(s => s.id === (currentSong?.id || ''));
          if (currentIndex > 0) {
            prevSong = playlist[currentIndex - 1];
          } else {
            prevSong = playlist[playlist.length - 1]; // Loop to end
          }
        }
        
        if (prevSong) {
          set({ currentSong: prevSong, isPlaying: true });
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
