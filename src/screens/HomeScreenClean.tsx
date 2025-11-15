// Home Screen - Clean version with .env API key configuration

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
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useAPIAnalysis } from '../hooks/useAPIAnalysis';
import { COLORS } from '../config/constants';

const { width } = Dimensions.get('window');

export const HomeScreen = ({ navigation }: any) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const {
    state,
    analyzeImage,
    cancel,
    getCacheStats,
  } = useAPIAnalysis();

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
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowProgress(true);
    
    try {
      const analysisResult = await analyzeImage(selectedImage);
      if (analysisResult) {
        navigation.navigate('Results', { 
          analysis: analysisResult,
          imageUri: selectedImage,
        });
      } else {
        Alert.alert(
          'Analysis Failed',
          state.error?.userMessage || 'Analysis returned no results. Please try again.',
          [
            { text: 'Retry', onPress: () => handleAnalyze() },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      Alert.alert(
        'Analysis Error',
        (error as any)?.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setShowProgress(false);
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

  // Removed clear cache action per requirement to keep cache for lifetime

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>💪 Muscle AI</Text>
          <Text style={styles.subtitle}>
            AI-Powered Muscle Analysis with Llama 3.2 11B Vision
          </Text>
        </View>

        {/* Live API Only - mock mode removed */}

        {/* Action Section */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cameraButton]}
            onPress={() => pickImage('camera')}
          >
            <Text style={styles.actionButtonIcon}>📷</Text>
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.galleryButton]}
            onPress={() => pickImage('gallery')}
          >
            <Text style={styles.actionButtonIcon}>🖼️</Text>
            <Text style={styles.actionButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
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
          </View>
        )}

        {/* How it Works */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it Works</Text>
          <View style={styles.stepContainer}>
            <Text style={styles.step}>📸 Upload a clear muscle photo</Text>
            <Text style={styles.step}>🤖 AI analyzes muscle development</Text>
            <Text style={styles.step}>📊 Get detailed scores & recommendations</Text>
            <Text style={styles.step}>📈 Track progress over time</Text>
          </View>
        </View>

        {/* Utility Buttons */}
        <View style={styles.utilitySection}>
          <TouchableOpacity
            style={styles.utilityButton}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.utilityButtonText}>📚 View History</Text>
          </TouchableOpacity>
          
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
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
  step: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
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
});
