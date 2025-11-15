import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { COLORS } from '../../config/constants';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonStyle?: 'primary' | 'destructive' | 'secondary';
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
}

const { width: screenWidth } = Dimensions.get('window');

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonStyle = 'primary',
  onConfirm,
  onCancel,
  icon,
}) => {
  const getConfirmButtonStyles = () => {
    switch (confirmButtonStyle) {
      case 'destructive':
        return [styles.confirmButton, styles.destructiveButton];
      case 'secondary':
        return [styles.confirmButton, styles.secondaryButton];
      default:
        return [styles.confirmButton, styles.primaryButton];
    }
  };

  const getConfirmTextStyles = () => {
    switch (confirmButtonStyle) {
      case 'destructive':
        return [styles.confirmButtonText, styles.destructiveButtonText];
      case 'secondary':
        return [styles.confirmButtonText, styles.secondaryButtonText];
      default:
        return [styles.confirmButtonText, styles.primaryButtonText];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
            {icon && (
              <View style={styles.iconContainer}>
                {icon}
              </View>
            )}
            
            <View style={styles.contentContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={getConfirmButtonStyles()}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text style={getConfirmTextStyles()}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
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
  },
  cancelButton: {
    flex: 1,
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
  confirmButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },
});
