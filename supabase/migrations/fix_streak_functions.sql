-- ============================================
-- STREAK SYSTEM - COMPLETE MIGRATION WITH FIXES
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop existing conflicting functions (if any)
DROP FUNCTION IF EXISTS public.initialize_user_streak(UUID);
DROP FUNCTION IF EXISTS public.update_user_streak(UUID);
DROP FUNCTION IF EXISTS public.get_user_streak_data(UUID);

-- Step 2: Recreate initialize_user_streak with correct return type
CREATE OR REPLACE FUNCTION public.initialize_user_streak(user_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_streaks (user_id)
  VALUES (user_uuid)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create update_user_streak function (with fixed first analysis logic)
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid UUID)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  is_new_record BOOLEAN,
  milestone_achieved TEXT
) AS $$
DECLARE
  streak_record RECORD;
  today_date DATE := CURRENT_DATE;
  days_since_last INTEGER;
  new_streak INTEGER;
  new_longest INTEGER;
  is_record BOOLEAN := FALSE;
  milestone TEXT := NULL;
BEGIN
  -- Initialize streak record if it doesn't exist
  PERFORM public.initialize_user_streak(user_uuid);
  
  -- Get current streak data
  SELECT * INTO streak_record 
  FROM public.user_streaks 
  WHERE user_id = user_uuid;
  
  -- Calculate days since last analysis and update streak logic
  IF streak_record.last_analysis_date IS NULL THEN
    -- First analysis ever - start streak at 1
    new_streak := 1;
  ELSE
    days_since_last := today_date - streak_record.last_analysis_date;
    
    IF days_since_last = 0 THEN
      -- Same day analysis, no change to streak
      new_streak := streak_record.current_streak;
    ELSIF days_since_last = 1 THEN
      -- Consecutive day, increment streak
      new_streak := streak_record.current_streak + 1;
    ELSE
      -- Missed days, reset streak to 1 (today's analysis)
      new_streak := 1;
    END IF;
  END IF;
  
  -- Update longest streak if new record
  IF new_streak > streak_record.longest_streak THEN
    new_longest := new_streak;
    is_record := TRUE;
  ELSE
    new_longest := streak_record.longest_streak;
  END IF;
  
  -- Check for milestone achievements
  IF new_streak = 7 THEN
    milestone := 'Dedicated Analyzer';
  ELSIF new_streak = 14 THEN
    milestone := 'Consistent Tracker';
  ELSIF new_streak = 30 THEN
    milestone := 'Muscle Expert';
  ELSIF new_streak = 60 THEN
    milestone := 'Fitness Champion';
  ELSIF new_streak = 100 THEN
    milestone := 'Streak Master';
  END IF;
  
  -- Update the streak record
  UPDATE public.user_streaks
  SET 
    current_streak = new_streak,
    longest_streak = new_longest,
    last_analysis_date = today_date,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Return results
  RETURN QUERY SELECT new_streak, new_longest, is_record, milestone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create get_user_streak_data function
CREATE OR REPLACE FUNCTION public.get_user_streak_data(user_uuid UUID)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  last_analysis_date DATE,
  streak_freeze_count INTEGER,
  days_since_last INTEGER,
  streak_status TEXT
) AS $$
DECLARE
  streak_record RECORD;
  days_diff INTEGER;
  status TEXT;
BEGIN
  -- Initialize streak record if it doesn't exist
  PERFORM public.initialize_user_streak(user_uuid);
  
  -- Get streak data
  SELECT * INTO streak_record 
  FROM public.user_streaks 
  WHERE user_id = user_uuid;
  
  -- Calculate days since last analysis
  IF streak_record.last_analysis_date IS NULL THEN
    days_diff := 0;
    status := 'new';
  ELSE
    days_diff := CURRENT_DATE - streak_record.last_analysis_date;
    
    IF days_diff = 0 THEN
      status := 'active_today';
    ELSIF days_diff = 1 THEN
      status := 'ready';
    ELSE
      status := 'broken';
    END IF;
  END IF;
  
  -- Return results
  RETURN QUERY SELECT 
    streak_record.current_streak,
    streak_record.longest_streak,
    streak_record.last_analysis_date,
    streak_record.streak_freeze_count,
    days_diff,
    status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verify functions are created
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('initialize_user_streak', 'update_user_streak', 'get_user_streak_data')
ORDER BY routine_name;
