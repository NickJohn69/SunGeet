import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// ── Listening History Helpers ──────────────────────────────────
const HISTORY_KEY = 'sungeet-listening-history';
const MAX_HISTORY_ARTISTS = 40;
const MAX_HISTORY_QUERIES = 30;

function getListeningHistory() {
  if (typeof window === 'undefined') return { artists: {}, queries: [], recentSongs: [] };
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return { artists: {}, queries: [], recentSongs: [] };
    return JSON.parse(raw);
  } catch { return { artists: {}, queries: [], recentSongs: [] }; }
}

function saveListeningHistory(history) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
}

function recordArtist(artistName) {
  if (!artistName || artistName === 'Unknown Artist') return;
  const history = getListeningHistory();
  const clean = artistName.trim();
  history.artists[clean] = (history.artists[clean] || 0) + 1;

  // Prune to top N artists by play-count
  const sorted = Object.entries(history.artists).sort((a, b) => b[1] - a[1]);
  if (sorted.length > MAX_HISTORY_ARTISTS) {
    history.artists = Object.fromEntries(sorted.slice(0, MAX_HISTORY_ARTISTS));
  }
  saveListeningHistory(history);
}

function recordQuery(query) {
  if (!query || !query.trim()) return;
  const history = getListeningHistory();
  const clean = query.trim().toLowerCase();
  // Remove duplicate if it exists, then prepend
  history.queries = [clean, ...history.queries.filter(q => q !== clean)].slice(0, MAX_HISTORY_QUERIES);
  saveListeningHistory(history);
}

function recordRecentSong(song) {
  if (!song || !song.id) return;
  const history = getListeningHistory();
  if (!history.recentSongs) history.recentSongs = [];
  // Remove duplicate, prepend
  history.recentSongs = [
    { id: song.id, title: song.title, author: song.author, thumbnail: song.thumbnail },
    ...history.recentSongs.filter(s => s.id !== song.id)
  ].slice(0, 50);
  saveListeningHistory(history);
}

/** Get top artists sorted by play count */
function getTopArtists(count = 5) {
  const history = getListeningHistory();
  return Object.entries(history.artists)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([name]) => name);
}

/** Get recent search queries */
function getRecentQueries(count = 5) {
  const history = getListeningHistory();
  return (history.queries || []).slice(0, count);
}

/** Build personalised search queries for recommendations */
function getPersonalisedQueries() {
  const topArtists = getTopArtists(4);
  const recentQueries = getRecentQueries(3);

  const queries = [];

  // Queries from top-listened artists
  topArtists.forEach(artist => {
    queries.push(`${artist} songs`);
  });

  // Queries from recent searches
  recentQueries.forEach(q => {
    // Avoid duplicating artist queries
    if (!queries.some(existing => existing.toLowerCase().includes(q))) {
      queries.push(q);
    }
  });

  // If we have nothing yet, fall back to generic
  if (queries.length === 0) {
    return ['new music releases 2024', 'popular hits 2024', 'latest trending songs'];
  }

  // Always add one trending query to keep things fresh
  queries.push('trending music 2024');

  // Deduplicate & cap at 5 to keep API calls reasonable
  return [...new Set(queries)].slice(0, 5);
}

// ── Export helpers so components can use them ──────────────────
export { getListeningHistory, recordArtist, recordQuery, recordRecentSong, getTopArtists, getRecentQueries, getPersonalisedQueries };

// ── Zustand Store ─────────────────────────────────────────────
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
      _autoPlayLock: false, // Prevents concurrent auto-play fetches
      
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleLyricsMode: () => set((state) => ({ isLyricsMode: !state.isLyricsMode })),
      
      setCurrentSong: (song) => {
        // Record to listening history
        if (song) {
          recordArtist(song.author);
          recordRecentSong(song);
        }
        set({ currentSong: song, isPlaying: true });
      },
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
          // Sort nested playlist_songs by order_index for correct sequential playback
          const sorted = (data || []).map(p => ({
            ...p,
            playlist_songs: (p.playlist_songs || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          }));
          set({ userPlaylists: sorted });
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
        if (playlist.length === 0) {
          // No queue – trigger auto-play similar music
          get().autoPlaySimilar();
          return;
        }
        
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
          } else {
            // Reached end of queue – auto-play similar
            get().autoPlaySimilar();
            return;
          }
        }
        
        if (nextSong) {
          set({ currentSong: nextSong, isPlaying: true });
          recordArtist(nextSong.author);
          recordRecentSong(nextSong);
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
      },

      /** Auto-play similar music when queue is empty */
      autoPlaySimilar: async () => {
        const { currentSong, _autoPlayLock } = get();
        if (_autoPlayLock || !currentSong) return;

        set({ _autoPlayLock: true });

        try {
          // Search for more songs by the same artist
          const artist = currentSong.author || '';
          const query = artist && artist !== 'Unknown Artist'
            ? `${artist} songs`
            : `${currentSong.title} similar music`;

          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();

          if (!Array.isArray(data) || data.length === 0) {
            set({ _autoPlayLock: false });
            return;
          }

          // Filter out the song that just ended, and pick a random one from top results
          const candidates = data.filter(s => s.id !== currentSong.id);
          if (candidates.length === 0) {
            set({ _autoPlayLock: false });
            return;
          }

          // Pick randomly from top 10 to keep things interesting
          const pick = candidates[Math.floor(Math.random() * Math.min(candidates.length, 10))];

          // Set a small queue of similar songs so the next few transitions are also smooth
          const queue = candidates.slice(0, 15);

          set({
            playlist: queue,
            currentSong: pick,
            isPlaying: true,
            _autoPlayLock: false,
          });

          recordArtist(pick.author);
          recordRecentSong(pick);
        } catch (err) {
          console.error('Auto-play similar failed:', err);
          set({ _autoPlayLock: false });
        }
      },
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
