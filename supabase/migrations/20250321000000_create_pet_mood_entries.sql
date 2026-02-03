-- Create pet_mood_entries table for the pet game feature
CREATE TABLE IF NOT EXISTS pet_mood_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'calm', 'anxious', 'sad', 'stressed', 'excited', 'tired', 'angry')),
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  note TEXT,
  ai_response TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pet_mood_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can only access their own pet mood entries" ON pet_mood_entries
  FOR ALL USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS pet_mood_entries_user_id_idx ON pet_mood_entries(user_id);
CREATE INDEX IF NOT EXISTS pet_mood_entries_timestamp_idx ON pet_mood_entries(timestamp);