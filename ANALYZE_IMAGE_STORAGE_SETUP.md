# Analyze Image Storage Setup Guide

This guide explains how to set up permanent image storage for the analyze feature in Supabase.

## Problem Solved

Previously, analyze images were stored as local URIs which disappeared after a few days when the system cleaned up temporary files. Now images are uploaded to Supabase Storage for permanent storage.

## Setup Steps

### 1. Create Storage Bucket in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New Bucket"**
4. Configure the bucket:
   - **Name**: `analyze-images`
   - **Public**: ✅ **YES** (so images can be displayed in the app)
   - **File size limit**: `10MB` (for high-quality muscle photos)
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

### 2. Run Storage Policies SQL

After creating the bucket, run the SQL from `supabase/analyze-images-storage-setup.sql` in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of analyze-images-storage-setup.sql
```

### 3. Verify Setup

1. Test the analyze feature by taking/uploading a photo
2. Check the Storage tab in Supabase dashboard - you should see uploaded images under `analyze-images/[user-id]/`
3. Check the `analysis_history` table - `image_url` should contain Supabase URLs instead of local URIs

## How It Works

### Before (Broken)
```
User takes photo → Local URI stored in DB → Image disappears after few days
```

### After (Fixed)
```
User takes photo → Image uploaded to Supabase Storage → Cloud URL stored in DB → Image persists forever
```

### Code Changes Made

1. **Added image upload functions** in `src/services/supabase.ts`:
   - `uploadAnalyzeImage()` - Uploads local image to cloud storage
   - `saveAnalysisWithImageUpload()` - Uploads image then saves analysis
   - `deleteAnalyzeImage()` - Cleans up storage when analysis is deleted

2. **Updated AnalyzeScreen** to use cloud storage:
   - Now calls `saveAnalysisWithImageUpload()` instead of `saveAnalysisToDatabase()`
   - Images are uploaded before analysis is saved

3. **Enhanced ProgressScreen** with better error handling for image loading

## File Structure in Storage

Images are organized as:
```
analyze-images/
├── [user-id-1]/
│   ├── 1704067200000_abc123.jpg
│   ├── 1704153600000_def456.png
│   └── ...
├── [user-id-2]/
│   ├── 1704240000000_ghi789.jpg
│   └── ...
```

## Automatic Cleanup

The setup includes an optional cleanup function that:
- Keeps only the latest 50 images per user
- Can be scheduled to run weekly via Supabase Cron Jobs
- Prevents storage from growing indefinitely

## Testing

1. **Take a new analyze photo** - should work normally
2. **Check Supabase Storage** - image should appear in `analyze-images/[user-id]/`
3. **Wait a few days** - image should still be visible in Progress tab
4. **Delete an analysis** - image should be removed from both DB and Storage

## Troubleshooting

### Images not uploading
- Check Supabase project URL and anon key in `.env`
- Verify bucket was created with correct name: `analyze-images`
- Check network connectivity

### Permission errors
- Ensure storage policies were applied correctly
- Verify bucket is set to public
- Check user authentication status

### Old analyses still show broken images
- These are from before the fix - images are permanently lost
- New analyses after this fix will have persistent images
- Consider clearing old analysis history if needed

## Migration Notes

- **Existing analyses**: Will keep their local URIs (which are broken)
- **New analyses**: Will use cloud storage URLs (which persist)
- **No data loss**: Analysis data itself is preserved, only images were affected
