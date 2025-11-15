/**
 * SUPABASE CLIENT SETUP
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. GOOGLE CLOUD CONSOLE SETUP:
 *    a. Go to https://console.cloud.google.com/
 *    b. Create a new project or select existing
 *    c. Enable "Google+ API" or "Google Sign-In API"
 *    d. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
 *    e. Choose "Web application" as application type
 *    f. Add Authorized redirect URIs:
 *       - https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
 *    g. Copy the Client ID (you'll need this for Supabase)
 * 
 * 2. SUPABASE DASHBOARD SETUP:
 *    a. Go to your Supabase project dashboard
 *    b. Navigate to Authentication > Providers
 *    c. Enable Google provider
 *    d. Paste your Google Client ID from step 1.g
 *    e. Leave Client Secret empty (not needed for mobile OAuth)
 *    f. Add these Redirect URLs:
 *       - com.muscleai.app://auth/callback
 *       - muscle-ai://auth/callback
 *    g. Copy your Supabase project URL and anon key
 * 
 * 3. ENVIRONMENT VARIABLES:
 *    Add these to your .env file:
 *    - EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
 *    - EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

 // Ensure the auth session is properly completed on iOS/Android
 WebBrowser.maybeCompleteAuthSession();

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file'
  );
}

// Custom storage adapter for React Native using AsyncStorage
const customStorage = {
  getItem: async (key: string) => {
    try {
      const item = await AsyncStorage.getItem(key);
      return item;
    } catch (error) {
      console.error('Error getting item from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in AsyncStorage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from AsyncStorage:', error);
    }
  },
};

// Create Supabase client with custom storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Mobile: handle OAuth callback via deep link + manual exchange
    flowType: 'pkce',
  },
});

// Helper function to create session from URL
export const createSessionFromUrl = async (url: string) => {
  try {
    const urlObj = new URL(url);
    const access_token = urlObj.searchParams.get('access_token');
    const refresh_token = urlObj.searchParams.get('refresh_token');

    if (!access_token) {
      return;
    }

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || '',
    });

    if (error) {
      throw error;
    }

    return data.session;
  } catch (error) {
    console.error('Error parsing URL:', error);
    throw error;
  }
};

// Helper function to perform Google OAuth
export const performOAuth = async () => {
  try {
    // Compute a correct redirect URI for the current environment (Expo Go or standalone)
    const redirectTo = getRedirectUrl();
    
    console.log('Redirect URI:', redirectTo);

    // Initiate OAuth flow with Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error('OAuth error:', error);
      throw error;
    }

    if (!data?.url) {
      throw new Error('No OAuth URL returned from Supabase');
    }

    console.log('Opening OAuth URL:', data.url);

    // Open OAuth URL in browser
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    );

    console.log('OAuth result:', result);

    if (result.type === 'success' && result.url) {
      console.log('OAuth success, waiting for deep-link handler to exchange code...');
      // Give the deep link handler a moment to run exchangeCodeForSession
      await new Promise(resolve => setTimeout(resolve, 1200));
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        console.log('Session established for user:', sessionData.session.user.email);
        return true;
      }
      // Even if session is not yet visible, consider success and let UI react to onAuthStateChange
      return true;
    }

    if (result.type === 'dismiss' || result.type === 'cancel') {
      // On Android, dismiss can happen when we programmatically close the browser from deep link
      console.log(`OAuth flow ended with "${result.type}" - checking for established session...`);
      await new Promise(resolve => setTimeout(resolve, 800));
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        console.log('Session established after browser close for user:', sessionData.session.user.email);
        return true;
      }
      return false;
    }

    return false;
  } catch (error) {
    console.error('Error during OAuth:', error);
    throw error;
  }
};

// Helper function to get redirect URL
export const getRedirectUrl = () => {
  // Use Expo Linking to generate the correct URL in Expo Go (exp://.../--/auth/callback)
  // and use the native scheme when building standalone/bare apps (muscleai://auth/callback)
  return Linking.createURL('auth/callback', {
    scheme: 'muscleai',
  });
};
