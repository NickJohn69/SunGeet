import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      userPlan: 'free', // 'free' or 'premium'

      // Sync session on load
      initialize: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          set({ session, user: session.user });
          // Super Admins are automatically Premium
          if (session.user.email === 'nickjohnpokharel13@gmail.com') {
            set({ userPlan: 'premium' });
          } else {
            get().fetchUserPlan(session.user.id);
          }
        }
      },

      setSession: (session) => {
        set({
          session,
          user: session ? session.user : null
        });
        if (session?.user) {
          get().fetchUserPlan(session.user.id);
        }
      },

      isSuperAdmin: () => {
        const { user } = get();
        return user?.email === 'nickjohnpokharel13@gmail.com';
      },

      fetchUserPlan: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('user_plans')
            .select('plan')
            .eq('user_id', userId)
            .single();

          // Super Admins are always premium regardless of what's in the DB
          if (get().isSuperAdmin()) {
            set({ userPlan: 'premium' });
            return;
          }

          if (error && error.code === 'PGRST116') {
            // No plan row exists in DB — this shouldn't happen if the trigger is installed,
            // but we'll insert a default 'free' plan as a fallback.
            await supabase
              .from('user_plans')
              .insert([{ user_id: userId, plan: 'free' }]);
            set({ userPlan: 'free' });
          } else if (data) {
            set({ userPlan: data.plan || 'free' });
          } else {
             // Fallback if data is missing but no error
             set({ userPlan: 'free' });
          }
        } catch (err) {
          console.error("Error fetching user plan:", err.message);
          set({ userPlan: 'free' }); // Default to free on error
        }
      },

      upgradePlan: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const { error } = await supabase
            .from('user_plans')
            .upsert({ user_id: user.id, plan: 'premium', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          if (error) throw error;
          set({ userPlan: 'premium' });
        } catch (err) {
          console.error("Error upgrading plan:", err.message);
          throw err;
        }
      },

      downgradePlan: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const { error } = await supabase
            .from('user_plans')
            .upsert({ user_id: user.id, plan: 'free', updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          if (error) throw error;
          set({ userPlan: 'free' });
        } catch (err) {
          console.error("Error downgrading plan:", err.message);
          throw err;
        }
      },

      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        set({ session: data.session, user: data.user });
        get().fetchUserPlan(data.user.id);
        return data;
      },

      signup: async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name }
          }
        });
        if (error) throw error;
        return data;
      },

      updateProfile: async (name) => {
        try {
          const { data, error } = await supabase.auth.updateUser({
            data: { display_name: name }
          });
          if (error) throw error;
          set({ user: data.user });
          return data;
        } catch (err) {
          console.error("Error updating profile:", err.message);
          throw err;
        }
      },

      resetPassword: async (email) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (error) throw error;
        } catch (err) {
          console.error("Error resetting password:", err.message);
          throw err;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        // Clear music player state
        const { clearStore } = (await import('./useStore')).default.getState();
        clearStore();
        set({ user: null, session: null, userPlan: 'free' });
      },
    }),
    {
      name: 'sungeet-auth-storage',
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        userPlan: state.userPlan
      })
    }
  )
);

export default useAuthStore;
