'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';

export default function ActivityTracker() {
  const { user } = useAuthStore();
  const intervalRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    startRef.current = Date.now();

    const sendHeartbeat = async () => {
      try {
        const now = Date.now();
        const elapsed = Math.floor((now - startRef.current) / 1000);
        startRef.current = now;

        if (elapsed < 1) return;

        const today = new Date().toISOString().split('T')[0];

        const { data: existing } = await supabase
          .from('user_activity')
          .select('seconds_active')
          .eq('user_id', user.id)
          .eq('activity_date', today)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('user_activity')
            .update({ seconds_active: existing.seconds_active + elapsed, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('activity_date', today);
        } else {
          await supabase
            .from('user_activity')
            .insert({ user_id: user.id, activity_date: today, seconds_active: elapsed });
        }
      } catch (err) {
        // Silently fail - activity tracking is non-critical
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        sendHeartbeat();
      } else {
        startRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    intervalRef.current = setInterval(sendHeartbeat, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      sendHeartbeat();
    };
  }, [user]);

  return null;
}
