import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
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
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 SimpleAuthContext: Starting...');
    
    // Simulate a quick check and then set loading to false
    setTimeout(() => {
      console.log('✅ SimpleAuthContext: Setting loading to false (no user)');
      setLoading(false);
    }, 1000);
  }, []);

  const signInWithGoogle = async () => {
    console.log('🔐 SimpleAuthContext: Mock Google sign in');
    // Mock successful sign in
    const mockUser = {
      id: 'mock-user-id',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;
    
    setUser(mockUser);
    setSession({ user: mockUser } as Session);
    setProfile({ username: 'Test User' });
  };

  const signOut = async () => {
    console.log('🔐 SimpleAuthContext: Mock sign out');
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    console.log('🔄 SimpleAuthContext: Mock refresh profile');
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
