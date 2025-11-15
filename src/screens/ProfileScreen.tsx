import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  ImageBackground,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../config/constants';
import { WaveGraph } from '../components/ui/WaveGraph';
import { Card } from '../components/ui/Card';
import { StatBadge } from '../components/dashboard/StatBadge';
import { MaterialCommunityIcons as Icon, Ionicons } from '@expo/vector-icons';
import { AnalysisResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, getAnalysisHistory, AnalysisHistoryRecord, supabase } from '../services/supabase';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { ImagePickerDialog } from '../components/ui/ImagePickerDialog';
import { getUserSubscriptionDetails } from '../services/subscriptionService';
import { SubscriptionDetails } from '../types/subscription';

const { width: screenWidth } = Dimensions.get('window');

interface UserProfile {
  username: string;
  joinDate: string;
  totalAnalyses: number;
  bestScore: number;
  currentStreak: number;
  improvement?: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_analysis',
    title: 'First Steps',
    description: 'Complete your first muscle analysis',
    icon: '🎯',
    isUnlocked: false,
  },
  {
    id: 'five_analyses',
    title: 'Getting Started',
    description: 'Complete 5 muscle analyses',
    icon: '📈',
    isUnlocked: false,
  },
  {
    id: 'ten_analyses',
    title: 'Dedicated Tracker',
    description: 'Complete 10 muscle analyses',
    icon: '🏃‍♂️',
    isUnlocked: false,
  },
  {
    id: 'high_score',
    title: 'Excellence',
    description: 'Achieve a score of 80 or higher',
    icon: '🏆',
    isUnlocked: false,
  },
  {
    id: 'perfect_score',
    title: 'Perfection',
    description: 'Achieve a perfect score of 100',
    icon: '💎',
    isUnlocked: false,
  },
  {
    id: 'weekly_streak',
    title: 'Consistency',
    description: 'Analyze for 7 consecutive days',
    icon: '🔥',
    isUnlocked: false,
  },
];

export const ProfileScreen = ({ navigation }: any) => {
  const { user, profile: authProfile, signOut, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    username: 'User',
    joinDate: new Date().toISOString(),
    totalAnalyses: 0,
    bestScore: 0,
    currentStreak: 0,
    achievements: ACHIEVEMENTS,
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  
  // Confirmation dialog states
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showImagePickerDialog, setShowImagePickerDialog] = useState(false);

  useEffect(() => {
    if (user || authProfile) {
      loadProfile();
    }
  }, [user, authProfile]);

  // Reload profile data whenever the Profile tab gains focus
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      return () => {};
    }, [])
  );

  const loadProfile = async () => {
    try {
      if (!user?.id) {
        console.log('No authenticated user, skipping profile load');
        return;
      }

      // Load subscription status
      const subscriptionData = await getUserSubscriptionDetails();
      setSubscription(subscriptionData);
      setHasActiveSubscription(subscriptionData?.subscription_status === 'active');

      // Load analysis history from database to calculate stats
      const dbHistory = await getAnalysisHistory(user.id);
      
      const totalAnalyses = dbHistory.length;
      const scores = dbHistory.map((record: AnalysisHistoryRecord) => record.overall_score || 0);
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
      
      // Calculate improvement: compare earliest score vs average of most recent up to 3 analyses
      let improvement = 0;
      if (totalAnalyses >= 2) {
        const earliestScore = scores[scores.length - 1];
        const recentScores = scores.slice(0, Math.min(3, scores.length));
        const recentAvg = recentScores.reduce((sum: number, score: number) => sum + score, 0) / recentScores.length;
        if (earliestScore > 0) {
          improvement = ((recentAvg - earliestScore) / earliestScore) * 100;
        } else {
          improvement = recentAvg > 0 ? 100 : 0;
        }
      }
      
      // Calculate achievements
      const updatedAchievements = ACHIEVEMENTS.map(achievement => {
        let isUnlocked = false;
        let unlockedAt = undefined;

        switch (achievement.id) {
          case 'first_analysis':
            isUnlocked = totalAnalyses >= 1;
            break;
          case 'five_analyses':
            isUnlocked = totalAnalyses >= 5;
            break;
          case 'ten_analyses':
            isUnlocked = totalAnalyses >= 10;
            break;
          case 'high_score':
            isUnlocked = bestScore >= 80;
            break;
          case 'perfect_score':
            isUnlocked = bestScore >= 100;
            break;
          case 'weekly_streak':
            // Simplified streak calculation
            isUnlocked = totalAnalyses >= 7;
            break;
        }

        if (isUnlocked && !achievement.isUnlocked) {
          unlockedAt = new Date().toISOString();
        }

        return {
          ...achievement,
          isUnlocked,
          unlockedAt: unlockedAt || achievement.unlockedAt,
        };
      });

      // Prioritize authenticated user data
      const displayName = authProfile?.username || authProfile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
      const memberSince = authProfile?.created_at || user?.created_at || new Date().toISOString();

      const updatedProfile = {
        ...profile,
        username: displayName,
        joinDate: memberSince,
        totalAnalyses,
        bestScore,
        improvement: Math.round(improvement),
        achievements: updatedAchievements,
      };

      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleEditProfile = async () => {
    if (!editUsername.trim()) {
      Alert.alert('Error', 'Please enter a valid username');
      return;
    }

    setIsUploading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      let avatarUrl = authProfile?.avatar_url;
      
      // Upload new profile image if selected
      if (selectedImage) {
        const uploadedUrl = await uploadProfileImage(selectedImage);
        if (!uploadedUrl) {
          Alert.alert('Error', 'Failed to upload profile image');
          setIsUploading(false);
          return;
        }
        avatarUrl = uploadedUrl;
      }
      
      // Update in Supabase if authenticated
      if (user) {
        const updateData: any = {
          username: editUsername.trim(),
        };
        
        if (avatarUrl) {
          updateData.avatar_url = avatarUrl;
        }
        
        const success = await updateUserProfile(user.id, updateData);
        
        if (success) {
          await refreshProfile();
          // Update local profile state
          const updatedProfile = {
            ...profile,
            username: editUsername.trim(),
          };
          setProfile(updatedProfile);
          
          setShowEditModal(false);
          setEditUsername('');
          setSelectedImage(null);
          Alert.alert('Success', 'Profile updated successfully');
        } else {
          Alert.alert('Error', 'Failed to update profile. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadProfileImage = async (imageUri: string): Promise<string | null> => {
    try {
      console.log('🖼️ Starting image upload for URI:', imageUri);
      
      // Get file extension
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      console.log('📁 Upload path:', filePath);

      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('📄 File read as base64, length:', base64.length);

      // Convert base64 to binary for upload
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (error) {
        console.error('❌ Error uploading image:', error);
        
        // Provide more specific error messages
        if (error.message?.includes('bucket')) {
          console.error('🪣 Storage bucket issue - make sure profile-images bucket exists');
        } else if (error.message?.includes('policy')) {
          console.error('🔒 Storage policy issue - check RLS policies');
        } else if (error.message?.includes('size')) {
          console.error('📏 File size issue - image might be too large');
        }
        
        return null;
      }

      console.log('✅ Image uploaded successfully:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL generated:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('❌ Error in uploadProfileImage:', error);
      return null;
    }
  };

  // Helper function to decode base64 to Uint8Array
  const decode = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const selectImage = () => {
    setShowImagePickerDialog(true);
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;
      
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images' as any,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
          return;
        }
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images' as any,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const resetProfile = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowResetDialog(true);
  };

  const handleResetConfirm = async () => {
    try {
      const resetProfile = {
        ...profile,
        username: authProfile?.username || authProfile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
        joinDate: authProfile?.created_at || user?.created_at || new Date().toISOString(),
        achievements: ACHIEVEMENTS,
      };
      setProfile(resetProfile);
      setShowResetDialog(false);
      // Show success message with a simple alert for now
      setTimeout(() => Alert.alert('Success', 'Profile reset successfully'), 100);
    } catch (error) {
      setShowResetDialog(false);
      setTimeout(() => Alert.alert('Error', 'Failed to reset profile'), 100);
    }
  };

  const handleSignOutConfirm = async () => {
    try {
      await signOut();
      setShowSignOutDialog(false);
    } catch (error) {
      console.error('Sign out error:', error);
      setShowSignOutDialog(false);
      setTimeout(() => Alert.alert('Error', 'Failed to sign out. Please try again.'), 100);
    }
  };

  const unlockedAchievements = profile.achievements.filter(a => a.isUnlocked);
  const totalAchievements = profile.achievements.length;
  const averageScore = profile.totalAnalyses > 0 ? Math.round(profile.bestScore * 0.8) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <LinearGradient
        colors={['#A67C52', '#8B4513', '#2F1B14', '#1A1A1A', '#0F0F0F', '#0A0A0A']}
        style={styles.backgroundGradient}
      >
          {/* Header with Settings */}
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={async () => {
                try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                const root = navigation.getParent?.()?.getParent?.();
                if (root?.navigate) root.navigate('Settings');
                else navigation.navigate('Settings');
              }}
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Profile Avatar */}
          <View style={styles.profileAvatarContainer}>
            <View style={styles.avatarWrapper}>
              {authProfile?.avatar_url ? (
                <Image 
                  source={{ uri: authProfile.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {profile.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{profile.username}</Text>
              {hasActiveSubscription && (
                <View style={styles.proBadge}>
                  <Text style={styles.proText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.userHandle}>@{profile.username}</Text>
            {authProfile?.email && (
              <Text style={styles.userEmail}>{authProfile.email}</Text>
            )}
            <Text style={styles.userBio}>Ready to transform your fitness journey with AI</Text>
            <Text style={styles.joinDate}>Member since {new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
          </View>

          {/* Subscription Banner - Only show if user doesn't have active subscription */}
          {!hasActiveSubscription && (
            <TouchableOpacity
              style={styles.subscriptionBanner}
              onPress={async () => {
                try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
                navigation.navigate('SubscriptionPlans');
              }}
            >
              <LinearGradient
                colors={['#F39C12', '#E67E22', '#D35400']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.subscriptionGradient}
              >
                <View style={styles.subscriptionContent}>
                  <View style={styles.subscriptionLeft}>
                    <Icon name="crown" size={28} color="#FFD700" />
                    <View style={styles.subscriptionText}>
                      <Text style={styles.subscriptionTitle}>Upgrade to Premium</Text>
                      <Text style={styles.subscriptionSubtitle}>Unlock unlimited AI analyses</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={24} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Active Subscription Badge - Show for paid users */}
          {hasActiveSubscription && subscription && (
            <TouchableOpacity
              style={styles.subscriptionBanner}
              onPress={async () => {
                try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
                navigation.navigate('ManageSubscription');
              }}
            >
              <LinearGradient
                colors={['#3498DB', '#2980B9', '#2471A3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.subscriptionGradient}
              >
                <View style={styles.subscriptionContent}>
                  <View style={styles.subscriptionLeft}>
                    <Icon name="crown" size={28} color="#FFD700" />
                    <View style={styles.subscriptionText}>
                      <Text style={styles.subscriptionTitle}>{subscription.plan_name} Plan Active</Text>
                      <Text style={styles.subscriptionSubtitle}>
                        {subscription.analyses_remaining} of {subscription.analyses_limit} analyses remaining
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={24} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => {
                setEditUsername(profile.username);
                setSelectedImage(null);
                setShowEditModal(true);
              }}
            >
              <Icon name="pencil" size={16} color="#FFFFFF" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowSignOutDialog(true);
              }}
            >
              <Icon name="logout" size={16} color="#FFFFFF" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Statistics Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Analyses</Text>
              <Text style={styles.statValue}>{profile.totalAnalyses}</Text>
              <WaveGraph color="#4A90E2" width={60} height={20} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Average Score</Text>
              <Text style={styles.statValue}>{averageScore}</Text>
              <WaveGraph color="#50C878" width={60} height={20} />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Best</Text>
              <Text style={styles.statValue}>{profile.bestScore}</Text>
              <WaveGraph color="#FF6B35" width={60} height={20} />
            </View>
          </View>

          {/* This Week's Highlights */}
          <View style={styles.highlightsSection}>
            <Text style={styles.highlightsTitle}>This Week's Highlights</Text>
            <View style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Text style={styles.performanceTitle}>Performance Up</Text>
                <WaveGraph 
                  color={
                    profile.improvement && profile.improvement > 0 
                      ? '#50C878'  // Green for positive
                      : profile.improvement && profile.improvement < 0 
                      ? '#EF4444'  // Red for negative
                      : '#FFFFFF'  // White for 0
                  } 
                  width={80} 
                  height={25} 
                />
              </View>
              <View style={styles.performanceMetric}>
                <Icon 
                  name={
                    profile.improvement && profile.improvement > 0 
                      ? "trending-up" 
                      : profile.improvement && profile.improvement < 0 
                      ? "trending-down"
                      : "trending-neutral"
                  } 
                  size={16} 
                  color={
                    profile.improvement && profile.improvement > 0 
                      ? '#50C878'  // Green for positive
                      : profile.improvement && profile.improvement < 0 
                      ? '#EF4444'  // Red for negative
                      : '#FFFFFF'  // White for 0
                  }
                />
                <Text style={[
                  styles.performanceText,
                  {
                    color: profile.improvement && profile.improvement > 0 
                      ? '#50C878'  // Green for positive
                      : profile.improvement && profile.improvement < 0 
                      ? '#EF4444'  // Red for negative
                      : '#FFFFFF'  // White for 0
                  }
                ]}>
                  {profile.improvement && profile.improvement > 0 
                    ? `+${profile.improvement}%` 
                    : profile.improvement && profile.improvement < 0 
                    ? `${profile.improvement}%`
                    : '0%'
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsList}>
              {profile.achievements.slice(0, 3).map((achievement) => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementItem,
                    !achievement.isUnlocked && styles.achievementLocked
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={[
                      styles.achievementTitle,
                      !achievement.isUnlocked && styles.achievementTitleLocked
                    ]}>
                      {achievement.title}
                    </Text>
                    <Text style={[
                      styles.achievementDescription,
                      !achievement.isUnlocked && styles.achievementDescriptionLocked
                    ]}>
                      {achievement.description}
                    </Text>
                  </View>
                  {achievement.isUnlocked && (
                    <View style={styles.achievementBadge}>
                      <Text style={styles.achievementBadgeText}>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

      </LinearGradient>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            {/* Profile Photo Section */}
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>Profile Photo</Text>
              <TouchableOpacity style={styles.photoContainer} onPress={selectImage}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.modalAvatar} />
                ) : authProfile?.avatar_url ? (
                  <Image source={{ uri: authProfile.avatar_url }} style={styles.modalAvatar} />
                ) : (
                  <View style={[styles.modalAvatar, styles.placeholderAvatar]}>
                    <Icon name="camera" size={24} color="#FFFFFF" />
                    <Text style={styles.placeholderText}>Tap to add photo</Text>
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Icon name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Username Section */}
            <View style={styles.usernameSection}>
              <Text style={styles.usernameLabel}>Username</Text>
              <TextInput
                style={styles.modalInput}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Enter new username"
                placeholderTextColor={COLORS.textSecondary}
                maxLength={20}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedImage(null);
                }}
                disabled={isUploading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, isUploading && styles.disabledButton]}
                onPress={handleEditProfile}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        visible={showSignOutDialog}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmButtonStyle="destructive"
        onConfirm={handleSignOutConfirm}
        onCancel={() => setShowSignOutDialog(false)}
        icon={<Icon name="logout" size={48} color={COLORS.danger} />}
      />

      <ConfirmationDialog
        visible={showResetDialog}
        title="Reset Profile"
        message="This will reset your profile data but keep your analysis history. Continue?"
        confirmText="Reset"
        cancelText="Cancel"
        confirmButtonStyle="destructive"
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetDialog(false)}
        icon={<Icon name="refresh" size={48} color={COLORS.warning} />}
      />

      <ImagePickerDialog
        visible={showImagePickerDialog}
        onCamera={() => {
          setShowImagePickerDialog(false);
          pickImage('camera');
        }}
        onGallery={() => {
          setShowImagePickerDialog(false);
          pickImage('gallery');
        }}
        onCancel={() => setShowImagePickerDialog(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    minHeight: '100%',
    paddingBottom: 0,
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: screenWidth * 0.6,
    height: 400,
    zIndex: 0,
  },
  fitnessModelSilhouette: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    marginTop: 50,
    marginRight: 20,
    // Simulate the fitness model silhouette
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  scrollContent: {
    paddingBottom: 0,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  avatarWrapper: {
    padding: 4,
    borderRadius: 70,
    backgroundColor: '#FF6B35',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5DC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 10,
  },
  proBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userHandle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
  joinDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 8,
  },
  subscriptionBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  subscriptionGradient: {
    padding: 20,
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  subscriptionText: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subscriptionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 30,
  },
  editProfileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shareQRButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  shareQRText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  highlightsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  highlightsTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
  },
  performanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  performanceMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  performanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#50C878',
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  achievementDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  achievementDescriptionLocked: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  achievementBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#50C878',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderAvatar: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 4,
    textAlign: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  usernameSection: {
    marginBottom: 20,
  },
  usernameLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
