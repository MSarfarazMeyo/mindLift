/*
  # Create test user accounts

  1. Test Users
    - Creates 5 test user accounts with different profiles and achievements
    - Each user has unique characteristics and progress
    - Includes varied mood and journal entries

  2. Data Population
    - Profiles with different names and preferences
    - Achievement records with varying points and streaks
    - Sample mood entries for the past week
    - Sample journal entries
*/

-- Insert test users into auth.users
DO $$
DECLARE
  user1_id uuid := gen_random_uuid();
  user2_id uuid := gen_random_uuid();
  user3_id uuid := gen_random_uuid();
  user4_id uuid := gen_random_uuid();
  user5_id uuid := gen_random_uuid();
BEGIN
  -- Create test users in auth.users
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES
    (user1_id, 'test1@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (user2_id, 'test2@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (user3_id, 'test3@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (user4_id, 'test4@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (user5_id, 'test5@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW());

  -- Create profiles for test users
  INSERT INTO profiles (id, username, email, name, subscription, created_at, updated_at)
  VALUES
    (user1_id, 'testuser1', 'test1@example.com', 'Sarah Johnson', 'trial', NOW(), NOW()),
    (user2_id, 'testuser2', 'test2@example.com', 'Michael Chen', 'yearly', NOW(), NOW()),
    (user3_id, 'testuser3', 'test3@example.com', 'Emma Davis', 'trial', NOW(), NOW()),
    (user4_id, 'testuser4', 'test4@example.com', 'James Wilson', NULL, NOW(), NOW()),
    (user5_id, 'testuser5', 'test5@example.com', 'Maria Garcia', 'yearly', NOW(), NOW());

  -- Create achievements for test users
  INSERT INTO achievements (user_id, total_points, login_streak, questions_answered, notes_written, last_login_date, created_at, updated_at)
  VALUES
    (user1_id, 1500, 5, 25, 10, CURRENT_DATE, NOW(), NOW()),
    (user2_id, 3200, 12, 45, 20, CURRENT_DATE, NOW(), NOW()),
    (user3_id, 750, 3, 15, 5, CURRENT_DATE, NOW(), NOW()),
    (user4_id, 200, 1, 5, 2, CURRENT_DATE, NOW(), NOW()),
    (user5_id, 4500, 20, 60, 30, CURRENT_DATE, NOW(), NOW());

  -- Create mood entries for the past week for each user
  INSERT INTO mood_entries (user_id, date, mood, note, created_at)
  SELECT
    user_id,
    CURRENT_DATE - (i || ' days')::interval,
    floor(random() * 5 + 1)::integer,
    CASE floor(random() * 5 + 1)::integer
      WHEN 1 THEN 'Feeling great today!'
      WHEN 2 THEN 'A bit stressed but managing'
      WHEN 3 THEN 'Regular day, nothing special'
      WHEN 4 THEN 'Had a productive day'
      ELSE 'Feeling motivated and energetic'
    END,
    NOW()
  FROM
    (SELECT unnest(ARRAY[user1_id, user2_id, user3_id, user4_id, user5_id]) as user_id) u
  CROSS JOIN
    generate_series(0, 6) i;

  -- Create journal entries for each user
  INSERT INTO journal_entries (user_id, date, mood, sleep, activities, notes, created_at)
  VALUES
    (user1_id, CURRENT_DATE, 'Happy', 'Good', 'Yoga, Reading', 'Had a productive day with lots of self-care activities', NOW()),
    (user2_id, CURRENT_DATE, 'Energetic', 'Excellent', 'Running, Meditation', 'Feeling very motivated and accomplished today', NOW()),
    (user3_id, CURRENT_DATE, 'Calm', 'Fair', 'Walking, Journaling', 'Taking things one step at a time', NOW()),
    (user4_id, CURRENT_DATE, 'Optimistic', 'Good', 'Gym, Reading', 'Starting to build better habits', NOW()),
    (user5_id, CURRENT_DATE, 'Content', 'Great', 'Meditation, Yoga', 'Feeling balanced and peaceful today', NOW());
END $$;