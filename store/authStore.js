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
          const premiumEmails = ['nickjohnpokharel13@gmail.com', 'prasannaaryal000@gmail.com', 'nickjohnpokharel18@gmail.com'];
          if (premiumEmails.includes(session.user.email)) {
            set({ userPlan: 'premium' });
          } else {
            await get().fetchUserPlan(session.user.id);
            get().subscribeToPlanChanges(session.user.id);
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
          get().subscribeToPlanChanges(session.user.id);
        }
      },

      subscribeToPlanChanges: (userId) => {
        const { planSubscription } = get();
        if (planSubscription) {
          supabase.removeChannel(planSubscription);
        }

        console.log(`[SunGeet] Subscribing to realtime plan changes for: ${userId}`);
        const channel = supabase
          .channel(`public:user_plans:user_id=eq.${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_plans',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('[SunGeet] Realtime Update Received:', payload.new.plan);
              set({ userPlan: payload.new.plan });
            }
          )
          .subscribe((status) => {
            console.log(`[SunGeet] Realtime Status for ${userId}:`, status);
          });

        set({ planSubscription: channel });
      },

      isSuperAdmin: () => {
        const { user } = get();
        return user?.email === 'nickjohnpokharel13@gmail.com';
      },

      fetchUserPlan: async (userId) => {
        if (!userId) return;
        try {
          console.log(`[SunGeet] Fetching plan from DB for: ${userId}`);
          const { data, error } = await supabase
            .from('user_plans')
            .select('plan')
            .eq('user_id', userId)
            .single();

          if (error) {
            console.warn(`[SunGeet] Plan fetch notice:`, error.message);
          }

          // Admins/Whitelisted users are always premium
          const premiumEmails = ['nickjohnpokharel13@gmail.com', 'prasannaaryal000@gmail.com', 'nickjohnpokharel18@gmail.com'];
          if (premiumEmails.includes(get().user?.email)) {
            set({ userPlan: 'premium' });
            return;
          }

          if (error && error.code === 'PGRST116') {
            console.log("[SunGeet] No plan found, creating default 'free' plan");
            await supabase
              .from('user_plans')
              .insert([{ user_id: userId, plan: 'free' }]);
            set({ userPlan: 'free' });
          } else if (data) {
            console.log(`[SunGeet] Current Plan Set To: ${data.plan}`);
            set({ userPlan: data.plan || 'free' });
          } else {
            set({ userPlan: 'free' });
          }
        } catch (err) {
          console.error("[SunGeet] Error in fetchUserPlan:", err.message);
          set({ userPlan: 'free' });
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
      }),
      onRehydrateStorage: () => (state) => {
        // After hydration, if we have a user, ensure we have a fresh plan and subscription
        if (state?.user) {
          state.fetchUserPlan(state.user.id);
          state.subscribeToPlanChanges(state.user.id);
        }
      }
    }
  )
);

export default useAuthStore;
