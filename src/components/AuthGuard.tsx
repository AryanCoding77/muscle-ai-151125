/**
 * AUTH GUARD COMPONENT
 * Protects routes that require authentication
 * Redirects to login screen if user is not authenticated
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { user, loading } = useAuth();
  const navigation = useNavigation<any>();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [user, loading, navigation]);

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {fallback || (
          <ActivityIndicator size="large" color={COLORS.primary} />
        )}
      </View>
    );
  }

  // If user is authenticated, render children
  if (user) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
};

// Higher-order component version for wrapping screens
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  return (props: P) => (
    <AuthGuard fallback={fallback}>
      <Component {...props} />
    </AuthGuard>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
