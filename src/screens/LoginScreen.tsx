import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config/constants';
import { Logo } from '../components/ui/Logo';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LoginScreen = ({ navigation }: any) => {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0A0A0A', '#1A1A1A', '#2F1B14', '#8B4513', '#A67C52']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo and App Name */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Logo size={100} />
              </View>
            </View>
            <Text style={styles.appName}>Muscle AI</Text>
            <Text style={styles.tagline}>AI-Powered Fitness Analysis</Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Icon name="camera" size={24} color="#FF6B35" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Smart Analysis</Text>
                <Text style={styles.featureDescription}>
                  Analyze your muscle development with AI
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Icon name="chart-line" size={24} color="#50C878" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Track Progress</Text>
                <Text style={styles.featureDescription}>
                  Monitor your fitness journey over time
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Icon name="trophy" size={24} color="#FFD700" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Achievements</Text>
                <Text style={styles.featureDescription}>
                  Unlock rewards and reach your goals
                </Text>
              </View>
            </View>
          </View>

          {/* Sign In Section */}
          <View style={styles.signInSection}>
            <Text style={styles.signInTitle}>Get Started</Text>
            <Text style={styles.signInSubtitle}>
              Sign in to begin your fitness transformation
            </Text>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <View style={styles.googleIconContainer}>
                    <Image
                      source={{
                        uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png',
                      }}
                      style={styles.googleIcon}
                    />
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimer}>
                By signing in, you agree to our{' '}
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  navigation?.navigate('TermsConditions');
                }}
              >
                <Text style={styles.disclaimerLink}>Terms & Conditions</Text>
              </TouchableOpacity>
              <Text style={styles.disclaimer}> and </Text>
              <TouchableOpacity
                onPress={async () => {
                  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  navigation?.navigate('PrivacyPolicy');
                }}
              >
                <Text style={styles.disclaimerLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Background Decoration */}
        <View style={styles.backgroundDecoration}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
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
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
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
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  featuresSection: {
    marginVertical: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  signInSection: {
    alignItems: 'center',
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  signInSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  googleIconContainer: {
    marginRight: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  disclaimerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
  },
  disclaimerLink: {
    fontSize: 12,
    color: '#FF6B35',
    textAlign: 'center',
    lineHeight: 16,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  circle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 142, 83, 0.05)',
  },
});
