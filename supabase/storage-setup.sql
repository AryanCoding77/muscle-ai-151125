-- Supabase Storage Setup for Profile Images
-- IMPORTANT: First create the bucket manually in Supabase Dashboard, then run this SQL

-- Step 1: Go to Storage in Supabase Dashboard
-- Step 2: Click "New Bucket"
-- Step 3: Name: "profile-images"
-- Step 4: Make it Public: YES
-- Step 5: File size limit: 5MB
-- Step 6: Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
-- Step 7: Then run the policies below

-- Create storage policies (RLS is already enabled by default)
-- Note: Only run these policies AFTER creating the bucket manually

-- Policy: Users can upload their own profile images
CREATE POLICY "Users can upload their own profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own profile images  
CREATE POLICY "Users can update their own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own profile images
CREATE POLICY "Users can delete their own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Public can view all profile images (since they're public)
CREATE POLICY "Public can view profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

-- Optional: Create a function to clean up old profile images when a new one is uploaded
CREATE OR REPLACE FUNCTION public.cleanup_old_profile_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old profile images for this user (keep only the latest 3)
  DELETE FROM storage.objects 
  WHERE bucket_id = 'profile-images' 
    AND name LIKE NEW.id || '-%'
    AND name != NEW.avatar_url
    AND id NOT IN (
      SELECT id FROM storage.objects 
      WHERE bucket_id = 'profile-images' 
        AND name LIKE NEW.id || '-%'
      ORDER BY created_at DESC 
      LIMIT 3
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to cleanup old images when profile is updated
DROP TRIGGER IF EXISTS on_profile_avatar_updated ON public.profiles;
CREATE TRIGGER on_profile_avatar_updated
  AFTER UPDATE OF avatar_url ON public.profiles
  FOR EACH ROW 
  WHEN (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
  EXECUTE FUNCTION public.cleanup_old_profile_images();
