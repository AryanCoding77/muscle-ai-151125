# Muscle AI - Supabase Authentication Setup Guide

## Overview
This guide will help you set up Supabase authentication with Google OAuth for your Muscle AI React Native app.

## Prerequisites
- Supabase account (https://supabase.com)
- Google Cloud Console account for OAuth setup
- React Native development environment

## Step 1: Supabase Project Setup

### 1.1 Create/Configure Supabase Project
1. Go to https://supabase.com and sign in
2. Create a new project or use your existing project
3. Note down your project URL and anon key (already in your .env file)

### 1.2 Set up Database Schema
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` 
4. Run the SQL to create the necessary tables and policies

## Step 2: Google OAuth Configuration

### 2.1 Google Cloud Console Setup
1. Go to https://console.cloud.google.com
2. Create a new project or select existing one
3. Enable Google+ API and Google Identity API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Create credentials for:
   - **Web application** (for Supabase)
   - **Android** (if building for Android)
   - **iOS** (if building for iOS)

### 2.2 Configure Redirect URLs
For the **Web application** OAuth client:
- Authorized redirect URIs: `https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback`

### 2.3 Supabase OAuth Configuration
1. In Supabase dashboard, go to Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Set redirect URL: `muscleai://auth/callback`

## Step 3: Mobile App Configuration

### 3.1 Deep Link Setup (React Native)
Add to your `app.json`:
```json
{
  "expo": {
    "scheme": "muscleai",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "muscleai"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.muscleai",
      "associatedDomains": ["applinks:muscleai.com"]
    }
  }
}
```

### 3.2 Environment Variables
Your `.env` file should contain:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Testing Authentication

### 4.1 Test Flow
1. Start your React Native app
2. You should see the login screen
3. Tap "Continue with Google"
4. Complete Google OAuth flow
5. You should be redirected to the main app
6. Check the Profile screen for user information

### 4.2 Troubleshooting
- **OAuth redirect issues**: Check your redirect URLs in both Google Console and Supabase
- **Deep link not working**: Verify your app.json configuration
- **Profile not loading**: Check Supabase database and RLS policies

## Step 5: Production Considerations

### 5.1 Security
- Enable Row Level Security (RLS) on all tables ✅
- Use environment variables for sensitive data ✅
- Implement proper error handling ✅

### 5.2 User Experience
- Loading states during authentication ✅
- Proper error messages ✅
- Seamless logout flow ✅

## Features Implemented

✅ **Authentication System**
- Google OAuth integration
- Session persistence
- Automatic profile creation

✅ **User Interface**
- Modern login screen with branding
- Loading screen during auth check
- Updated profile screen with real user data

✅ **Navigation Protection**
- Routes protected by authentication
- Automatic redirect based on auth state

✅ **Profile Management**
- Display Google profile information
- Edit username functionality
- Logout with confirmation

✅ **Database Integration**
- User profiles table with RLS
- Automatic profile creation on signup
- Analysis history tracking (prepared)

## Next Steps
1. Run the SQL schema in your Supabase dashboard
2. Configure Google OAuth in Supabase
3. Test the authentication flow
4. Deploy and test on physical devices

## Support
If you encounter issues, check:
1. Supabase logs in the dashboard
2. React Native debugger console
3. Network requests in development tools
