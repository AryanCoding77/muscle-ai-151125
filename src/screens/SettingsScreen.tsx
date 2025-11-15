import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { supabase } from '../lib/supabase';


export const SettingsScreen = ({ navigation }: any) => {
  const { user, profile: authProfile, signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  
  const haptic = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  };

  // Get user display information
  const displayName = authProfile?.username || authProfile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const handleLogout = async () => {
    haptic();
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await signOut();
      setShowLogoutDialog(false);
    } catch (error) {
      console.error('Logout error:', error);
      setShowLogoutDialog(false);
      setTimeout(() => Alert.alert('Error', 'Failed to logout. Please try again.'), 100);
    }
  };

  const handleDeleteRequest = async () => {
    haptic();
    setShowReasonDialog(true);
  };

  const handleReasonSubmit = () => {
    if (!deletionReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for account deletion.');
      return;
    }
    setShowReasonDialog(false);
    // Show confirmation dialog after reason is provided
    setTimeout(() => setShowDeleteDialog(true), 300);
  };

  const handleDeleteConfirm = async () => {
    if (!user?.id || !user?.email) {
      setShowDeleteDialog(false);
      Alert.alert('Error', 'User information not found. Please try again.');
      return;
    }

    try {
      // Insert deletion request into database with user-provided reason
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: user.id,
          email: user.email,
          reason: deletionReason.trim(),
          status: 'pending'
        })
        .select()
        .single();

      setShowDeleteDialog(false);

      if (error) {
        console.error('❌ Error submitting deletion request:', error);
        setTimeout(() => {
          Alert.alert(
            'Error',
            'Failed to submit deletion request. Please try again or contact support.',
            [{ text: 'OK' }]
          );
        }, 100);
        return;
      }

      console.log('✅ Deletion request submitted:', data);
      
      // Clear the reason input
      setDeletionReason('');
      
      // Show success message
      setTimeout(() => {
        Alert.alert(
          'Request Submitted',
          'Your account deletion request has been submitted successfully. Our team will process your request within 24-48 hours. You will receive a confirmation email shortly.',
          [{ text: 'OK' }]
        );
      }, 100);
    } catch (error) {
      console.error('❌ Exception submitting deletion request:', error);
      setShowDeleteDialog(false);
      setTimeout(() => {
        Alert.alert(
          'Error',
          'An unexpected error occurred. Please try again later.',
          [{ text: 'OK' }]
        );
      }, 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerBar}> 
          <TouchableOpacity onPress={() => { haptic(); navigation.goBack(); }} style={styles.headerIconBtn}>
            <Icon name="chevron-left" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Profile</Text>
          <View style={styles.headerIconSpacer} />
        </View>

        {/* Profile summary card */}
        <View style={styles.profileCard}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <Image source={require('../../assets/icon.png')} style={styles.avatar} />
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
          </View>
          <TouchableOpacity onPress={haptic} style={styles.editBtn}>
            <Icon name="pencil-outline" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Settings section */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <Row icon="card-account-phone-outline" label="Contact" onPress={haptic} />
          <View style={styles.rowDivider} />
          <Row icon="trash-can-outline" label="Request for Account Deletion" onPress={handleDeleteRequest} isDestructive />
        </View>

        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Icon name="logout" size={20} color="#FF453A" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        visible={showLogoutDialog}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmButtonStyle="destructive"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutDialog(false)}
        icon={<Icon name="logout" size={48} color={COLORS.danger} />}
      />

      {/* Reason Input Dialog */}
      <Modal
        visible={showReasonDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowReasonDialog(false);
          setDeletionReason('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reasonDialog}>
            <Icon name="delete-alert" size={48} color={COLORS.danger} style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Account Deletion</Text>
            <Text style={styles.modalMessage}>
              Please tell us why you want to delete your account. This helps us improve our service.
            </Text>
            
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter your reason here..."
              placeholderTextColor={COLORS.textSecondary}
              value={deletionReason}
              onChangeText={setDeletionReason}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowReasonDialog(false);
                  setDeletionReason('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.continueButton]}
                onPress={handleReasonSubmit}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Dialog */}
      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Delete Account"
        message="Are you sure you want to request account deletion? This action will permanently delete all your data including workout history, progress, and subscription. This cannot be undone."
        confirmText="Request Deletion"
        cancelText="Cancel"
        confirmButtonStyle="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeletionReason('');
        }}
        icon={<Icon name="delete-alert" size={48} color={COLORS.danger} />}
      />
    </SafeAreaView>
  );
};

function Row({ icon, label, onPress, isDestructive }: { icon: string; label: string; onPress?: () => void; isDestructive?: boolean }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIconWrap}>
          <Icon name={icon as any} size={24} color={isDestructive ? COLORS.danger : COLORS.text} />
        </View>
        <Text style={[styles.rowLabel, isDestructive && { color: COLORS.danger }]}>{label}</Text>
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 20,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerIconSpacer: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  profileEmail: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 56,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    marginBottom: 30,
    gap: 8,
  },
  logoutText: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reasonDialog: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  reasonInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    color: COLORS.text,
    fontSize: 15,
    minHeight: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: COLORS.danger,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
