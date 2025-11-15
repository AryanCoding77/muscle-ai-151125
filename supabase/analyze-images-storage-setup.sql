-- Supabase Storage Setup for Analyze Images
-- IMPORTANT: First create the bucket manually in Supabase Dashboard, then run this SQL

-- Step 1: Go to Storage in Supabase Dashboard
-- Step 2: Click "New Bucket"
-- Step 3: Name: "analyze-images"
-- Step 4: Make it Public: YES (so images can be displayed in the app)
-- Step 5: File size limit: 10MB (larger than profile images for high-quality muscle photos)
-- Step 6: Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
-- Step 7: Then run the policies below

-- Create storage policies for analyze images
-- Note: Only run these policies AFTER creating the bucket manually

-- Policy: Users can upload their own analyze images
CREATE POLICY "Users can upload their own analyze images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'analyze-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own analyze images
CREATE POLICY "Users can view their own analyze images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'analyze-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own analyze images
CREATE POLICY "Users can delete their own analyze images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'analyze-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Optional: Create a function to clean up old analyze images (keep last 50 per user)
CREATE OR REPLACE FUNCTION public.cleanup_old_analyze_images()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- For each user, keep only their latest 50 analyze images
  FOR user_record IN 
    SELECT DISTINCT (storage.foldername(name))[1] as user_id
    FROM storage.objects 
    WHERE bucket_id = 'analyze-images'
  LOOP
    DELETE FROM storage.objects 
    WHERE bucket_id = 'analyze-images' 
      AND (storage.foldername(name))[1] = user_record.user_id
      AND id NOT IN (
        SELECT id FROM storage.objects 
        WHERE bucket_id = 'analyze-images' 
          AND (storage.foldername(name))[1] = user_record.user_id
        ORDER BY created_at DESC 
        LIMIT 50
      );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled function to run cleanup weekly (optional)
-- You can set this up in Supabase Dashboard > Database > Cron Jobs
-- SELECT cron.schedule('cleanup-analyze-images', '0 2 * * 0', 'SELECT public.cleanup_old_analyze_images();');
