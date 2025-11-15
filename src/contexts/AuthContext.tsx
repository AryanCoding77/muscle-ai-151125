/**
 * AUTH CONTEXT PROVIDER
 * Manages authentication state across the entire app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase, performOAuth } from '../lib/supabase';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        
        // Small delay to ensure storage is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (currentSession) {
          console.log('Existing session found:', currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
        setIsReady(true);
      }
    };

    checkSession();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          setSession(session);
          setUser(session.user);
        } else {
          setSession(null);
          setUser(null);
        }
        
        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in successfully');
            break;
          case 'SIGNED_OUT':
            console.log('User signed out');
            break;
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully');
            break;
          case 'USER_UPDATED':
            console.log('User data updated');
            break;
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Handle deep links for OAuth callback
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (url.includes('auth/callback')) {
        try {
          // Close the in-app browser if it's still open
          try { WebBrowser.dismissBrowser(); } catch {}

          // Extract authorization code from the callback URL
          let code: string | null = null;
          try {
            const urlObj = new URL(url);
            code = urlObj.searchParams.get('code');
            if (!code && urlObj.hash) {
              const hashParams = new URLSearchParams(urlObj.hash.replace(/^#/, ''));
              code = hashParams.get('code');
            }
          } catch (e) {
            console.warn('Failed to parse deep link URL for code:', e);
          }

          if (code) {
            // Exchange the auth code for a Supabase session manually
            console.log('Deep link code received, exchanging for session');
            try {
              const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              if (exchangeError) {
                console.error('Error exchanging code from deep link:', exchangeError);
              } else if (sessionData?.session) {
                console.log('Session established from deep link:', sessionData.session.user.email);
                setSession(sessionData.session);
                setUser(sessionData.session.user);
                return;
              }
            } catch (error) {
              console.error('Error in code exchange:', error);
            }
          }

          // Fallback: check if a session is already available
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error handling deep link (fallback getSession):', error);
          }
          if (data?.session) {
            setSession(data.session);
            setUser(data.session.user);
          }
        } catch (error) {
          console.error('Error processing auth callback:', error);
        }
      }
    };

    // Handle initial URL if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const success = await performOAuth();

      // Always check if a session exists (Android may return 'dismiss' even on success)
      const { data: postAuth } = await supabase.auth.getSession();
      if (postAuth?.session) {
        setSession(postAuth.session);
        setUser(postAuth.session.user);
        return;
      }

      if (!success) {
        Alert.alert(
          'Sign In Cancelled',
          'The sign-in process was cancelled. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Sign In Error',
        error.message || 'An error occurred during sign in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setSession(null);
      setUser(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      Alert.alert(
        'Sign Out Error',
        error.message || 'An error occurred during sign out. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Refresh session
  const refreshSession = async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }
    } catch (error: any) {
      console.error('Session refresh error:', error);
      // If refresh fails, sign out the user
      await signOut();
    }
  };

  const value = {
    user,
    session,
    loading: loading || !isReady,
    signInWithGoogle,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
