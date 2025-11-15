# Authentication Fix Instructions

## The Problem
The app was stuck in loading state after Google authentication because the redirect URL wasn't being handled properly.

## Changes Made

1. **Improved redirect URL handling** - Now uses Expo's `makeRedirectUri` which works with both Expo Go and standalone builds
2. **Added session polling** - After authentication, the app polls for the session up to 5 times
3. **Enhanced deep link handling** - Better detection and processing of callback URLs
4. **Comprehensive logging** - Added emoji-prefixed logs to track the entire auth flow

## Steps to Fix

### 1. Reload the App
In your Expo terminal, press **`r`** to reload the app

### 2. Click "Continue with Google"
Watch the console logs carefully. You should see:
```
🔗 Redirect URL: <some-url>
🔗 Auth redirect (use this in Supabase): <some-url>
```

### 3. Add the Redirect URL to Supabase

The logged redirect URL will be one of these formats:

**If using Expo Go:**
- `exp://10.186.159.117:8081` (or similar with your IP)
- `exp+muscle-ai://expo-development-client/?url=...`

**If using a development/production build:**
- `muscleai://`

**Copy the exact URL from the console** and add it to your Supabase dashboard:
- Go to Authentication → URL Configuration → Redirect URLs
- Click "Add URL"
- Paste the URL you copied from the console
- Click "Save"

### 4. Test Again
After adding the correct URL to Supabase:
1. Reload the app (press `r` in Expo)
2. Click "Continue with Google"
3. Complete the authentication
4. Watch the console for these success logs:
   - `✅ Session found after polling` OR
   - `✅ Deep link: Session established!` OR
   - `✅ Session established successfully!`

## Expected Console Output (Successful Flow)

```
🔗 Redirect URL: exp://10.186.159.117:8081
🌐 Opening OAuth URL: https://...supabase.co/auth/v1/authorize...
📱 OAuth result: dismiss no URL
⏳ OAuth flow ended with "dismiss" - checking for established session...
🔄 Attempt 1/5: No session yet, waiting...
🔄 Attempt 2/5: No session yet, waiting...
✅ Session found after polling
🔄 AuthContext: Auth state changed: SIGNED_IN user@example.com
✅ AppNavigator: User authenticated, showing main app
```

## If It Still Doesn't Work

### Option 1: Build a Development Build (Recommended)
Expo Go has limitations with custom URL schemes. Building a development build will make the custom `muscleai://` scheme work properly:

```bash
# Install EAS CLI
npm install -g eas-cli

# Build development build
eas build --profile development --platform android
```

### Option 2: Use Expo's Auth Proxy
You can use Expo's built-in auth proxy for Expo Go:
1. The redirect URL will be automatically handled
2. No need to configure custom schemes

## Troubleshooting

### Deep link not received
- **Check:** Is the redirect URL in Supabase exactly matching the console log?
- **Try:** Rebuilding the app with `eas build`

### Session not found after polling
- **Check:** Is Google OAuth configured correctly in Supabase?
- **Try:** Using implicit flow instead of PKCE

### Browser doesn't close
- **Check:** The redirect URL might be incorrect
- **Try:** Manually closing the browser and checking if the app updates

## Contact
If none of these steps work, share the complete console output from when you click "Continue with Google" until it fails.
