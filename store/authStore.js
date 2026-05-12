import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // { username: string }
      login: (username) => set({ user: { username } }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'sungeet-auth-storage',
    }
  )
);

export default useAuthStore;
