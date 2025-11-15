import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, UserProfile, getUserProfile } from '../services/supabase';
import { Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Ensure the auth session is properly completed on iOS/Android when returning from the browser
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 AuthContext: useEffect starting...');
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ AuthContext: Loading timeout reached, forcing loading = false');
      setLoading(false);
    }, 10000); // 10 seconds max

    // Check if user is already logged in
    checkUser().finally(() => {
      clearTimeout(loadingTimeout);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 AuthContext: Auth state changed:', event, session?.user?.email);

      if (session) {
        setSession(session);
        setUser(session.user);

        // Don't block UI on profile fetch
        setLoading(false);

        // Fetch user profile in background
        getUserProfile(session.user.id)
          .then((userProfile) => {
            if (userProfile) {
              setProfile(userProfile);
            } else {
              return createProfile(session.user);
            }
          })
          .catch((err) => {
            console.error('Error fetching/creating profile:', err);
          });
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Handle deep links for OAuth callback (supports PKCE code exchange)
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('🔗 Deep link received:', url);
      // Handle both Expo Go URLs and standalone build URLs
      if (!url.includes('auth') && !url.includes('muscleai') && !url.includes('exp://')) return;

      try {
        // Close the in-app browser if it's still open
        try { WebBrowser.dismissBrowser(); } catch {}

        // Try to extract the authorization code from the URL
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
          // Exchange the auth code for a Supabase session
          console.log('🔑 Deep link: Found code, exchanging for session...');
          try {
            const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('❌ Deep link: Error exchanging code:', exchangeError);
            } else if (sessionData?.session) {
              console.log('✅ Deep link: Session established!');
              setSession(sessionData.session);
              setUser(sessionData.session.user);
              return;
            }
          } catch (err) {
            console.error('❌ Deep link: Error in code exchange:', err);
          }
        } else {
          console.log('⚠️ Deep link: No code found in URL');
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
    };

    // Handle initial URL if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial URL detected:', url);
        handleDeepLink(url);
      } else {
        console.log('ℹ️ No initial URL');
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

  const checkUser = async () => {
    console.log('🔍 AuthContext: Starting checkUser...');
    try {
      console.log('🔍 AuthContext: Calling supabase.auth.getSession()...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ AuthContext: Error getting session:', error);
        setLoading(false);
        return;
      }

      if (session) {
        console.log('✅ AuthContext: Session found, user:', session.user.email);
        setSession(session);
        setUser(session.user);

        // Fetch user profile in background (don't block UI)
        getUserProfile(session.user.id)
          .then((userProfile) => {
            if (userProfile) {
              console.log('✅ AuthContext: Profile loaded');
              setProfile(userProfile);
            } else {
              console.log('⚠️ AuthContext: No profile found, creating...');
              return createProfile(session.user);
            }
          })
          .catch((err) => {
            console.error('❌ AuthContext: Error fetching/creating profile:', err);
          });
      } else {
        console.log('ℹ️ AuthContext: No session found');
      }
    } catch (error) {
      console.error('❌ AuthContext: Error in checkUser:', error);
    } finally {
      console.log('✅ AuthContext: Setting loading to false');
      setLoading(false);
    }
  };

  const createProfile = async (user: User) => {
    try {
      const profileData = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        username: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error('Error creating profile:', error);
      } else {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error in createProfile:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Use Expo's redirect URL which works with both Expo Go and standalone builds
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'muscleai',
      });

      console.log('🔗 Redirect URL:', redirectUrl);
      console.log('🔗 Auth redirect (use this in Supabase):', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        Alert.alert('Authentication Error', 'Failed to sign in with Google. Please try again.');
        return;
      }

      if (data?.url) {
        console.log('🌐 Opening OAuth URL:', data.url);
        
        // Open the OAuth URL in browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log('📱 OAuth result:', result.type, 'url' in result && result.url ? 'with URL' : 'no URL');

        if (result.type === 'success' && 'url' in result && result.url) {
          // Prefer PKCE: try exchanging authorization code first
          try {
            const redirect = new URL(result.url);
            let code = redirect.searchParams.get('code');
            if (!code && redirect.hash) {
              const hashParams = new URLSearchParams(redirect.hash.replace(/^#/, ''));
              code = hashParams.get('code');
            }

            if (code) {
              console.log('🔑 Found authorization code, exchanging for session...');
              const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              if (exchangeError) {
                console.error('❌ Error exchanging code:', exchangeError);
              } else if (sessionData?.session) {
                console.log('✅ Session established successfully!');
                setSession(sessionData.session);
                setUser(sessionData.session.user);
                return;
              }
            } else {
              console.log('⚠️ No authorization code found in callback URL');
            }

            // Fallback to implicit tokens in URL fragment (older flows)
            const fragment = redirect.hash.substring(1);
            const params = new URLSearchParams(fragment);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token && refresh_token) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (sessionError) {
                console.error('Error setting session:', sessionError);
                Alert.alert('Authentication Error', 'Failed to complete sign in. Please try again.');
              }
            }
          } catch (parseErr) {
            console.error('Error handling OAuth redirect:', parseErr);
          }
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          console.log(`⏳ OAuth flow ended with "${result.type}" - checking for established session...`);
          
          // Wait a bit for the session to be established
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check multiple times for session
          for (let i = 0; i < 5; i++) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              console.log('✅ Session found after polling');
              setSession(sessionData.session);
              setUser(sessionData.session.user);
              return;
            }
            console.log(`🔄 Attempt ${i + 1}/5: No session yet, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          console.log('❌ No session found after polling');
        } else {
          console.log('❌ OAuth flow failed:', result);
        }
      }
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      Alert.alert('Authentication Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        Alert.alert('Sign Out Error', 'Failed to sign out. Please try again.');
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error in signOut:', error);
      Alert.alert('Sign Out Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
      }
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
