/*
  SUNGEET DATABASE SCHEMA - USER PLANS
  
  Run this SQL in your Supabase SQL Editor to:
  1. Create the user_plans table (if it doesn't exist).
  2. Set 'free' as the default value for the plan column.
  3. Automatically create a 'free' plan entry when a new user signs up.
*/

-- 1. Create the user_plans table
CREATE TABLE IF NOT EXISTS public.user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS on user_plans
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users can view their own plan
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own plan') THEN
        CREATE POLICY "Users can view their own plan" ON public.user_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can update their own plan
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own plan') THEN
        CREATE POLICY "Users can update their own plan" ON public.user_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Create a logic function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user_plan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_plans (user_id, plan)
  VALUES (new.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_for_plan ON auth.users;
CREATE TRIGGER on_auth_user_created_for_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_plan();

-- 6. For existing users: ensure they also have a plan row
INSERT INTO public.user_plans (user_id, plan)
SELECT id, 'free' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
