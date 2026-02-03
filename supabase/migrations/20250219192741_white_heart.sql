/*
  # Save account progress

  1. Changes
    - Add new columns to achievements table:
      - `last_questions_date` to track when questions were last answered
      - `total_points` to store points
      - `login_streak` to track consecutive logins
      - `questions_answered` to count answered questions
      - `notes_written` to count written notes

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to achievements table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'achievements' AND column_name = 'last_questions_date'
  ) THEN
    ALTER TABLE achievements ADD COLUMN last_questions_date date;
  END IF;
END $$;

-- Update achievements table to sync with local storage structure
CREATE OR REPLACE FUNCTION sync_achievements() 
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = now();
  
  -- Ensure non-negative values
  NEW.total_points = GREATEST(0, NEW.total_points);
  NEW.login_streak = GREATEST(0, NEW.login_streak);
  NEW.questions_answered = GREATEST(0, NEW.questions_answered);
  NEW.notes_written = GREATEST(0, NEW.notes_written);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for achievements sync
DROP TRIGGER IF EXISTS before_achievement_update ON achievements;
CREATE TRIGGER before_achievement_update
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION sync_achievements();