/*
  # Initial Schema Setup for Mental Wellness App

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - References auth.users
      - `username` (text)
      - `email` (text)
      - `name` (text)
      - `subscription` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `mood_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References profiles
      - `date` (date)
      - `mood` (integer)
      - `note` (text)
      - `created_at` (timestamptz)

    - `journal_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References profiles
      - `date` (date)
      - `mood` (text)
      - `sleep` (text)
      - `activities` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

    - `achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References profiles
      - `total_points` (integer)
      - `login_streak` (integer)
      - `questions_answered` (integer)
      - `notes_written` (integer)
      - `last_login_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read their own data
      - Create their own entries
      - Update their own data
      - No deletion allowed for data integrity
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE,
  email text UNIQUE,
  name text,
  subscription text CHECK (subscription IN ('trial', 'yearly', NULL)),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create mood_entries table
CREATE TABLE mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  mood integer CHECK (mood >= 1 AND mood <= 5),
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create journal_entries table
CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  mood text,
  sleep text,
  activities text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  total_points integer DEFAULT 0,
  login_streak integer DEFAULT 0,
  questions_answered integer DEFAULT 0,
  notes_written integer DEFAULT 0,
  last_login_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for mood_entries
CREATE POLICY "Users can view own mood entries"
  ON mood_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for journal_entries
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for achievements
CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON achievements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION handle_profile_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile updates
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_profile_updated();

-- Create function to handle achievement updates
CREATE OR REPLACE FUNCTION handle_achievement_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for achievement updates
CREATE TRIGGER on_achievement_updated
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION handle_achievement_updated();