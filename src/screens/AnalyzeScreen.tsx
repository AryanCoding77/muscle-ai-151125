import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useAPIAnalysis } from '../hooks/useAPIAnalysis';
import { COLORS } from '../config/constants';
import { APIErrorCode } from '../types/api.types';
import { saveAnalysisWithImageUpload, supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { getUserSubscriptionDetails } from '../services/subscriptionService';

const { width } = Dimensions.get('window');

export const AnalyzeScreen = ({ navigation }: any) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const { user } = useAuth();

  const {
    state,
    result,
    analyzeImage,
    cancel,
    getCacheStats,
  } = useAPIAnalysis();

  // Check subscription status on component mount
  React.useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setCheckingSubscription(true);
      const subscription = await getUserSubscriptionDetails();
      const isActive = subscription?.subscription_status === 'active';
      setHasActiveSubscription(isActive);
      console.log('🔒 Subscription check:', isActive ? 'Active' : 'Inactive');
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasActiveSubscription(false);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    let result;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    // Check if user has active subscription
    if (!hasActiveSubscription) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        '🔒 Premium Feature',
        'You need an active subscription to analyze images. Please purchase a plan to continue.',
        [
          {
            text: 'View Plans',
            onPress: () => navigation.navigate('SubscriptionPlans'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }
    
    console.log('🎬 === USER INITIATED ANALYSIS ===');
    console.log('📸 Selected Image:', selectedImage);
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowProgress(true);
    
    try {
      console.log('🚀 Calling analyzeImage from hook...');
      const analysisResult = await analyzeImage(selectedImage);
      
      if (analysisResult) {
        console.log('✅ Analysis completed successfully, uploading image and saving to database...');
        try {
          if (!user?.id) {
            console.error('No authenticated user found');
            Alert.alert('Authentication Error', 'Please log in to save analysis results');
            return;
          }

          const overallScore = analysisResult.overall_assessment?.overall_physique_score ?? 0;
          
          // Use the new function that uploads image to cloud storage first
          const analysisId = await saveAnalysisWithImageUpload(
            user.id,
            analysisResult,
            overallScore,
            selectedImage
          );

          if (analysisId) {
            console.log('✅ Analysis and image saved successfully with ID:', analysisId);
          } else {
            console.error('Failed to save analysis to database');
            Alert.alert('Save Error', 'Failed to save analysis results. Please try again.');
          }
        } catch (e) {
          console.error('Error saving analysis result to database:', e);
          Alert.alert('Save Error', 'Failed to save analysis results. Please try again.');
        }

        navigation.navigate('Results', { 
          analysis: analysisResult,
          imageUri: selectedImage
        });
      } else {
        console.error('❌ Analysis returned null result');
        const actions: any[] = [
          { text: 'Retry', onPress: () => handleAnalyze() },
          { text: 'OK', style: 'cancel' },
        ];
        Alert.alert(
          'Analysis Failed', 
          state.error?.userMessage || 'Analysis returned no results. Please try again.',
          actions
        );
      }
    } catch (error) {
      console.error('💥 Analysis exception in AnalyzeScreen:', error);
      const errorMessage = (error as any)?.message || 'Unknown error occurred';
      
      const actions: any[] = [
        { text: 'Retry', onPress: () => handleAnalyze() },
        { text: 'Cancel', style: 'cancel' },
      ];
      Alert.alert(
        'Analysis Error', 
        `${errorMessage}\n\nTip: Check the terminal for detailed error logs.`,
        actions
      );
    } finally {
      setShowProgress(false);
      console.log('🏁 Analysis UI process completed');
    }
  };


  const showCacheStats = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const stats = await getCacheStats();
    Alert.alert(
      'Cache Statistics',
      `Entries: ${stats.totalEntries}\nSize: ${(stats.totalSize / 1024).toFixed(2)} KB\nOldest: ${
        stats.oldestEntry ? new Date(stats.oldestEntry).toLocaleDateString() : 'N/A'
      }`
    );
  };

  // Show loading state while checking subscription
  if (checkingSubscription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking subscription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show subscription required message if no active subscription
  if (!hasActiveSubscription) {
    return (
      <ImageBackground
        source={require('../../assets/pre-analyze-demo.png')}
        style={styles.fullScreenBackground}
        imageStyle={styles.demoImage}
      >
        <BlurView intensity={50} style={styles.blurContainer}>
          <View style={styles.darkOverlay}>
            <SafeAreaView style={styles.safeAreaContent}>
              <View style={styles.premiumLockCard}>
                <View style={styles.lockIconContainer}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
                <Text style={styles.restrictedTitle}>Premium Feature</Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>SUBSCRIPTION REQUIRED</Text>
                </View>
                <Text style={styles.restrictedMessage}>
                  Unlock AI-powered muscle analysis with detailed insights, personalized recommendations, and progress tracking.
                </Text>
                <TouchableOpacity
                  style={styles.subscriptionButton}
                  onPress={() => navigation.navigate('SubscriptionPlans')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.subscriptionButtonText}>🚀 View Premium Plans</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </BlurView>
      </ImageBackground>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Muscle Analysis</Text>
          <Text style={styles.subtitle}>
            Upload a clear photo of your muscles to get AI-powered analysis and recommendations
          </Text>
        </View>


        {/* Selected Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreview}>
            <Text style={styles.previewTitle}>Selected Image</Text>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={handleAnalyze}
              disabled={state.isLoading}
            >
              <Text style={styles.analyzeButtonText}>
                {state.isLoading ? '🔄 Analyzing...' : '🔍 Analyze Muscles'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.reuploadButton}
              onPress={() => pickImage('gallery')}
              disabled={state.isLoading}
            >
              <Text style={styles.reuploadButtonText}>
                📷 Re-upload
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upload Image Section - Only show when no image is selected */}
        {!selectedImage && (
          <View style={styles.uploadSection}>
            <TouchableOpacity 
              style={styles.uploadArea}
              onPress={() => pickImage('gallery')}
            >
              <View style={styles.cloudIcon}>
                <Text style={styles.cloudText}>☁️</Text>
                <Text style={styles.uploadArrow}>↑</Text>
              </View>
              <Text style={styles.uploadText}>Drag file here to upload</Text>
              <Text style={styles.uploadSubtext}>Max file size: 5mb</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Utility Buttons */}
        <View style={styles.utilitySection}>
          <TouchableOpacity
            style={styles.utilityButton}
            onPress={showCacheStats}
          >
            <Text style={styles.utilityButtonText}>📊 Cache Stats</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Progress Modal */}
      <Modal
        visible={showProgress}
        transparent
        animationType="fade"
      >
        <View style={styles.progressOverlay}>
          <View style={styles.progressModal}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.progressTitle}>Analyzing Image</Text>
            <Text style={styles.progressMessage}>
              {state.statusMessage || 'Processing your muscle photo...'}
            </Text>
            {state.progress > 0 && (
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${state.progress}%` }]} />
              </View>
            )}
            {state.retryCount > 0 && (
              <Text style={styles.retryText}>Retry attempt: {state.retryCount}</Text>
            )}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                cancel();
                setShowProgress(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    minHeight: Dimensions.get('window').height - 100,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cameraButton: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  galleryButton: {
    borderColor: COLORS.secondary,
    borderWidth: 2,
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 30,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  previewImage: {
    width: width * 0.6,
    height: width * 0.8,
    borderRadius: 12,
    marginBottom: 16,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reuploadButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reuploadButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  stepContainer: {
    gap: 12,
  },
  uploadSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
  },
  cloudIcon: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  cloudText: {
    fontSize: 48,
    color: '#4A90E2',
  },
  uploadArrow: {
    position: 'absolute',
    fontSize: 24,
    color: '#4A90E2',
    top: 12,
    fontWeight: 'bold',
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  utilitySection: {
    gap: 12,
  },
  utilityButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  utilityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressModal: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: width * 0.8,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  progressMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  retryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: Dimensions.get('window').height - 200,
  },
  premiumLockCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    maxWidth: 350,
  },
  lockIconContainer: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
  },
  lockIcon: {
    fontSize: 36,
  },
  restrictedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  premiumBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  restrictedMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  subscriptionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 0,
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  subscriptionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  fullScreenBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  demoImage: {
    resizeMode: 'cover',
  },
  blurContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
    width: '100%',
    height: '100%',
  },
  safeAreaContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
});
