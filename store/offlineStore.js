import { create } from 'zustand';
import localforage from 'localforage';
import useAuthStore from './authStore';

localforage.config({
  name: 'SunGeet',
  storeName: 'offline_music'
});

const useOfflineStore = create((set, get) => ({
  offlineTracks: [],
  
  loadOfflineTracks: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ offlineTracks: [] });
      return;
    }
    
    try {
      const keys = await localforage.keys();
      const userPrefix = `track_${user.username}_`;
      const userKeys = keys.filter(k => k.startsWith(userPrefix));
      
      const tracks = [];
      for (const key of userKeys) {
        const item = await localforage.getItem(key);
        if (item && item.metadata) {
          tracks.push(item.metadata);
        }
      }
      set({ offlineTracks: tracks });
    } catch (error) {
      console.error("Error loading offline tracks", error);
    }
  },

  saveTrackOffline: async (song, audioBlob) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      alert("Please login to save music to your account.");
      return false;
    }
    
    try {
      const key = `track_${user.username}_${song.id}`;
      await localforage.setItem(key, {
        metadata: song,
        audioBlob: audioBlob
      });
      get().loadOfflineTracks();
      return true;
    } catch (error) {
      console.error("Error saving track offline", error);
      return false;
    }
  },

  removeTrackOffline: async (songId) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    try {
      const key = `track_${user.username}_${songId}`;
      await localforage.removeItem(key);
      get().loadOfflineTracks();
    } catch (error) {
      console.error("Error removing offline track", error);
    }
  },

  getTrackUrl: async (songId) => {
    const user = useAuthStore.getState().user;
    if (!user) return null;
    
    try {
      const key = `track_${user.username}_${songId}`;
      const item = await localforage.getItem(key);
      if (item && item.audioBlob) {
        return URL.createObjectURL(item.audioBlob);
      }
      return null;
    } catch (error) {
      console.error("Error getting track url", error);
      return null;
    }
  }
}));

export default useOfflineStore;
