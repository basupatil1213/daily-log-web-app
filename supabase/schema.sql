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
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6366F1',
  icon        TEXT NOT NULL DEFAULT '⭐',
  is_default  BOOLEAN DEFAULT FALSE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name)
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
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

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

-- Categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE USING (auth.uid() = user_id AND is_default = FALSE);

-- Time logs
CREATE POLICY "Users can view own logs"
  ON time_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON time_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
  ON time_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON time_logs FOR DELETE USING (auth.uid() = user_id);

-- ─── AUTO-CREATE PROFILE + DEFAULT CATEGORIES ────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Insert default categories
  INSERT INTO public.categories (user_id, name, color, icon, is_default) VALUES
    (NEW.id, 'Sleep',          '#8B5CF6', '😴', TRUE),
    (NEW.id, 'Work',           '#F59E0B', '💼', TRUE),
    (NEW.id, 'Exercise',       '#10B981', '🏃', TRUE),
    (NEW.id, 'Meals',          '#F97316', '🍴', TRUE),
    (NEW.id, 'Learning',       '#3B82F6', '📚', TRUE),
    (NEW.id, 'Leisure',        '#EC4899', '🎮', TRUE),
    (NEW.id, 'Social',         '#A78BFA', '👥', TRUE),
    (NEW.id, 'Commute',        '#94A3B8', '🚗', TRUE),
    (NEW.id, 'Personal Care',  '#06B6D4', '🧘', TRUE),
    (NEW.id, 'Entertainment',  '#EF4444', '🎬', TRUE),
    (NEW.id, 'Social Media',   '#0EA5E9', '📱', TRUE),
    (NEW.id, 'Reading',        '#84CC16', '📖', TRUE),
    (NEW.id, 'Hobbies',        '#D946EF', '🎨', TRUE),
    (NEW.id, 'Family',         '#F43F5E', '👪', TRUE),
    (NEW.id, 'Health',         '#14B8A6', '🏥', TRUE),
    (NEW.id, 'Shopping',       '#FBBF24', '🛒', TRUE),
    (NEW.id, 'Cooking',        '#FB923C', '🍳', TRUE),
    (NEW.id, 'Other',          '#6B7280', '⭐', TRUE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── MIGRATION: add new categories for existing users ────────
-- Run this block if you already have users in your database.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).
DO $$
DECLARE
  uid UUID;
BEGIN
  FOR uid IN SELECT id FROM auth.users LOOP
    INSERT INTO public.categories (user_id, name, color, icon, is_default) VALUES
      (uid, 'Entertainment', '#EF4444', '🎬', TRUE),
      (uid, 'Social Media',  '#0EA5E9', '📱', TRUE),
      (uid, 'Reading',       '#84CC16', '📖', TRUE),
      (uid, 'Hobbies',       '#D946EF', '🎨', TRUE),
      (uid, 'Family',        '#F43F5E', '👪', TRUE),
      (uid, 'Health',        '#14B8A6', '🏥', TRUE),
      (uid, 'Shopping',      '#FBBF24', '🛒', TRUE),
      (uid, 'Cooking',       '#FB923C', '🍳', TRUE)
    ON CONFLICT (user_id, name) DO NOTHING;
  END LOOP;
END;
$$;
