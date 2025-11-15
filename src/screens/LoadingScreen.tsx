import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '../components/ui/Logo';

export const LoadingScreen = () => {
  return (
    <LinearGradient
      colors={['#0A0A0A', '#1A1A1A', '#2F1B14']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Logo size={80} />
            </View>
          </View>
          
          <Text style={styles.appName}>Muscle AI</Text>
          
          <ActivityIndicator size="large" color="#FF6B35" style={styles.spinner} />
          
          <Text style={styles.loadingText}>Loading your fitness journey...</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});
