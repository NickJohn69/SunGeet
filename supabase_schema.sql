/*
  SUNGEET DATABASE SCHEMA - FULL SETUP

  Run this entire SQL in your Supabase SQL Editor to:
  1. Create the user_plans table (if it doesn't exist).
  2. Create the user_activity table for time tracking.
  3. Create the get_admin_stats RPC function.
  4. Set up all necessary RLS policies.
*/

-- ════════════════════════════════════════════════════════════════
-- 1. USER PLANS TABLE
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own plan') THEN
    CREATE POLICY "Users can view their own plan" ON public.user_plans
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own plan') THEN
    CREATE POLICY "Users can update their own plan" ON public.user_plans
      FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user_plan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_plans (user_id, plan) VALUES (new.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_for_plan ON auth.users;
CREATE TRIGGER on_auth_user_created_for_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_plan();

INSERT INTO public.user_plans (user_id, plan)
SELECT id, 'free' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- 2. USER ACTIVITY TABLE (time tracking)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  seconds_active INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, activity_date)
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Users can see ONLY their own activity (for the tracker to upsert)
CREATE POLICY "Users can view own activity" ON public.user_activity
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can insert their own activity
CREATE POLICY "Users can insert own activity" ON public.user_activity
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own activity
CREATE POLICY "Users can update own activity" ON public.user_activity
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow admin to read all activity (service_role key from RPC)
CREATE POLICY "Admin can read all activity" ON public.user_activity
  FOR SELECT TO service_role USING (true);

-- ════════════════════════════════════════════════════════════════
-- 3. ADMIN STATS RPC FUNCTION
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result json;
BEGIN
  WITH user_data AS (
    SELECT
      au.id AS user_id,
      au.email,
      au.raw_user_meta_data->>'display_name' AS display_name,
      au.created_at,
      au.last_sign_in_at,
      COALESCE(up.plan, 'free') AS plan,
      COALESCE(ua.total_seconds, 0) AS seconds_active
    FROM auth.users au
    LEFT JOIN public.user_plans up ON up.user_id = au.id
    LEFT JOIN (
      SELECT user_id, SUM(seconds_active) AS total_seconds
      FROM public.user_activity
      GROUP BY user_id
    ) ua ON ua.user_id = au.id
    ORDER BY au.created_at DESC
  ),
  counts AS (
    SELECT
      COUNT(*) AS total_users,
      COUNT(*) FILTER (WHERE plan = 'premium') AS premium_users,
      COUNT(*) FILTER (WHERE plan = 'free') AS free_users
    FROM user_data
  ),
  playlist_stats AS (
    SELECT
      COUNT(*) AS total_playlists,
      COALESCE(SUM(song_count), 0) AS total_songs
    FROM (
      SELECT p.id, COUNT(ps.id) AS song_count
      FROM public.playlists p
      LEFT JOIN public.playlist_songs ps ON ps.playlist_id = p.id
      GROUP BY p.id
    ) sub
  )
  SELECT json_build_object(
    'total_users', c.total_users,
    'premium_users', c.premium_users,
    'free_users', c.free_users,
    'total_playlists', ps.total_playlists,
    'total_songs', ps.total_songs,
    'user_plan_details', json_agg(
      json_build_object(
        'user_id', ud.user_id,
        'email', ud.email,
        'display_name', ud.display_name,
        'plan', ud.plan,
        'created_at', ud.created_at,
        'last_sign_in_at', ud.last_sign_in_at,
        'seconds_active', ud.seconds_active
      ) ORDER BY ud.created_at DESC
    )
  ) INTO result
  FROM user_data ud, counts c, playlist_stats ps
  GROUP BY c.total_users, c.premium_users, c.free_users, ps.total_playlists, ps.total_songs;

  RETURN result;
END;
$$;

-- ════════════════════════════════════════════════════════════════
-- 4. GRANT EXECUTE PERMISSIONS
-- ════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION public.get_admin_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats TO service_role;
