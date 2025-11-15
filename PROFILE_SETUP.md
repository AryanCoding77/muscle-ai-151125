# Profile Photo Setup Guide

This guide explains how to set up profile photo functionality for the Muscle AI app.

## Prerequisites

1. Supabase project with authentication enabled
2. Database schema already set up (profiles table exists)

## Setup Steps

### 1. Create Storage Bucket (Manual Setup Required)

**Step 1: Create Bucket Manually**
1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New Bucket"**
4. Fill in the details:
   - **Name**: `profile-images`
   - **Public bucket**: ✅ **YES** (check this box)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`
5. Click **"Create bucket"**

**Step 2: Set Up Policies**
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase/storage-setup.sql`
3. Execute the script to create the storage policies

> **Note**: You must create the bucket manually first because SQL INSERT into storage.buckets requires owner permissions that aren't available in the SQL editor.

### 2. Verify Storage Setup

1. Go to **Storage** in your Supabase dashboard
2. You should see a bucket named `profile-images`
3. The bucket should be set to **Public** with a 5MB file size limit
4. Allowed MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

### 3. Test the Functionality

1. Run the app: `npm start`
2. Navigate to the Profile screen
3. Tap "Edit Profile"
4. Try uploading a profile photo from camera or gallery
5. Update the username
6. Save changes
7. Verify the changes persist after app reload

## Features Implemented

### ✅ Username Editing
- **Fixed**: Username now properly updates in the database
- **Fixed**: UI refreshes correctly after username change
- **Fixed**: Changes persist after app reload

### ✅ Profile Photo Upload
- **New**: Camera and gallery photo selection
- **New**: Image upload to Supabase storage
- **New**: Profile photos stored in user-specific folders
- **New**: Automatic cleanup of old profile images

### ✅ Enhanced UI
- **Improved**: Modal now includes both username and photo editing
- **New**: Loading states during upload
- **New**: Proper error handling and user feedback
- **New**: Image preview in edit modal

## File Structure

```
src/
├── screens/
│   └── ProfileScreen.tsx          # Updated with photo upload functionality
├── services/
│   └── supabase.ts               # Already has updateUserProfile function
supabase/
├── storage-setup.sql             # Storage bucket setup script
└── supabase-schema.sql          # Main database schema (already exists)
```

## Storage Policies

The storage setup includes these security policies:

- **Upload**: Users can only upload to their own folder (`user_id/filename`)
- **Update**: Users can only update their own images
- **Delete**: Users can only delete their own images  
- **View**: All profile images are publicly viewable (for app functionality)

## Troubleshooting

### Common Issues

1. **"Failed to upload profile image"**
   - Check if storage bucket exists
   - Verify RLS policies are set correctly
   - Ensure user is authenticated

2. **"Permission Required" for camera/gallery**
   - The app will request permissions automatically
   - User needs to grant camera/gallery access

3. **Username not updating**
   - Check network connection
   - Verify user is authenticated
   - Check Supabase logs for errors

### Debug Steps

1. Check browser console for errors
2. Verify Supabase storage bucket exists
3. Test with Supabase dashboard storage upload
4. Check RLS policies in Supabase

## Security Notes

- Images are stored in user-specific folders for security
- Old profile images are automatically cleaned up (keeps latest 3)
- All uploads are validated for file type and size
- RLS policies prevent unauthorized access

## Next Steps

The profile editing functionality is now complete with:
- ✅ Username editing with database persistence
- ✅ Profile photo upload and storage
- ✅ Proper error handling and loading states
- ✅ Security policies and cleanup functions

Users can now fully edit their profiles with both username and photo changes that persist across app sessions.
