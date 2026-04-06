-- ============================================================
-- CHRONICLE — Daily Time Tracker
-- Supabase SQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── PROFILES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── CATEGORIES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  color       TEXT NOT NULL DEFAULT '#6366F1',
  icon        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── TIME LOGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_logs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date             DATE NOT NULL,
  hour             SMALLINT NOT NULL CHECK (hour >= 0 AND hour <= 23),
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  note             TEXT,
  duration_minutes SMALLINT DEFAULT 60 NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date, hour)
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_time_logs_user_date ON time_logs(user_id, date);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs  ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories (global — readable by any authenticated user, not user-specific)
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT USING (auth.role() = 'authenticated');

-- Time logs
CREATE POLICY "Users can view own logs"
  ON time_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON time_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
  ON time_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON time_logs FOR DELETE USING (auth.uid() = user_id);

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── SEED GLOBAL CATEGORIES ──────────────────────────────────
-- Run once. Safe to re-run (ON CONFLICT DO NOTHING).
INSERT INTO public.categories (name, color, icon) VALUES
  ('Sleep',         '#8B5CF6', ''),
  ('Work',          '#F59E0B', ''),
  ('Exercise',      '#10B981', ''),
  ('Meals',         '#F97316', ''),
  ('Learning',      '#3B82F6', ''),
  ('Leisure',       '#EC4899', ''),
  ('Social',        '#A78BFA', ''),
  ('Commute',       '#94A3B8', ''),
  ('Personal Care', '#06B6D4', ''),
  ('Entertainment', '#EF4444', ''),
  ('Social Media',  '#0EA5E9', ''),
  ('Reading',       '#84CC16', ''),
  ('Hobbies',       '#D946EF', ''),
  ('Family',        '#F43F5E', ''),
  ('Health',        '#14B8A6', ''),
  ('Shopping',      '#FBBF24', ''),
  ('Cooking',       '#FB923C', ''),
  ('Other',         '#6B7280', '')
ON CONFLICT (name) DO NOTHING;
