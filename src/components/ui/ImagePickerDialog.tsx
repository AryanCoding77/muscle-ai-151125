import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../../config/constants';

interface ImagePickerDialogProps {
  visible: boolean;
  onCamera: () => void;
  onGallery: () => void;
  onCancel: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const ImagePickerDialog: React.FC<ImagePickerDialogProps> = ({
  visible,
  onCamera,
  onGallery,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          <View style={styles.iconContainer}>
            <Icon name="camera" size={48} color={COLORS.primary} />
          </View>
          
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Select Profile Photo</Text>
            <Text style={styles.message}>Choose how you want to select your profile photo</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.optionButton, styles.cameraButton]}
              onPress={onCamera}
              activeOpacity={0.8}
            >
              <Icon name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.optionButtonText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.galleryButton]}
              onPress={onGallery}
              activeOpacity={0.8}
            >
              <Icon name="image" size={24} color="#FFFFFF" />
              <Text style={styles.optionButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  dialogContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    width: screenWidth * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  contentContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: COLORS.primary,
  },
  galleryButton: {
    backgroundColor: COLORS.secondary,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
