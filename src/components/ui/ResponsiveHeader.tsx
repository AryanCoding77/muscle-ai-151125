import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/constants';
import { useNotifications } from '../../context/NotificationContext';

const { width } = Dimensions.get('window');

interface ResponsiveHeaderProps {
  userName: string;
  userAvatar?: string;
  subtitle: string;
  onSettingsPress: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

const ResponsiveHeaderBase: React.FC<ResponsiveHeaderProps> = ({
  userName,
  userAvatar,
  subtitle,
  onSettingsPress,
  onNotificationPress,
  onProfilePress,
}) => {
  const isSmallScreen = width < 380;
  const isTablet = width >= 768;
  const { unreadCount } = useNotifications();
  
  const handleNotificationPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onNotificationPress?.();
  };

  const handleSettingsPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onSettingsPress();
  };

  const handleProfilePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onProfilePress?.();
  };

  return (
    <View>
      <View style={[
        styles.container,
        isTablet && styles.containerTablet,
        isSmallScreen && styles.containerSmall
      ]}>
        <TouchableOpacity 
          style={styles.leftSection}
          onPress={handleProfilePress}
          activeOpacity={0.7}
          disabled={!onProfilePress}
        >
          <View style={[
            styles.avatar,
            isSmallScreen && styles.avatarSmall,
            isTablet && styles.avatarTablet
          ]}>
            {userAvatar ? (
              <Image 
                source={{ uri: userAvatar }} 
                style={[
                  styles.avatarImage,
                  isSmallScreen && styles.avatarImageSmall,
                  isTablet && styles.avatarImageTablet
                ]}
              />
            ) : (
              <View style={styles.avatarInner}>
                <Ionicons 
                  name="person" 
                  size={isSmallScreen ? 16 : isTablet ? 24 : 20} 
                  color={COLORS.textSecondary} 
                />
              </View>
            )}
          </View>
          <View style={styles.textContainer}>
            <View style={styles.greetingRow}>
              <Text style={[
                styles.greeting,
                isSmallScreen && styles.greetingSmall,
                isTablet && styles.greetingTablet
              ]}>
                Hello {userName}
              </Text>
              <Text style={[
                styles.waveEmoji,
                isSmallScreen && styles.waveEmojiSmall,
                isTablet && styles.waveEmojiTablet
              ]}>
                👋
              </Text>
            </View>
            <Text style={[
              styles.subtitle,
              isSmallScreen && styles.subtitleSmall,
              isTablet && styles.subtitleTablet
            ]}>
              {subtitle}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              isSmallScreen && styles.iconButtonSmall,
              isTablet && styles.iconButtonTablet
            ]}
            onPress={handleNotificationPress}
            activeOpacity={0.7}
          >
            <View style={styles.notificationContainer}>
              <Ionicons 
                name="notifications" 
                size={isSmallScreen ? 18 : isTablet ? 24 : 20} 
                color={COLORS.text} 
              />
              {unreadCount > 0 && (
                <View style={[
                  styles.notificationBadge,
                  isSmallScreen && styles.notificationBadgeSmall,
                  isTablet && styles.notificationBadgeTablet
                ]}>
                  <Text style={[
                    styles.badgeText,
                    isSmallScreen && styles.badgeTextSmall,
                    isTablet && styles.badgeTextTablet
                  ]}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.iconButton,
              isSmallScreen && styles.iconButtonSmall,
              isTablet && styles.iconButtonTablet
            ]}
            onPress={handleSettingsPress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="settings" 
              size={isSmallScreen ? 18 : isTablet ? 24 : 20} 
              color={COLORS.text} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Soft blur effect at bottom */}
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.95)',
          'rgba(0, 0, 0, 0.7)',
          'rgba(0, 0, 0, 0.3)',
          'rgba(28, 28, 30, 0)'
        ]}
        style={styles.blurEffect}
        pointerEvents="none"
      />
    </View>
  );
};

export const ResponsiveHeader = memo(ResponsiveHeaderBase);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginHorizontal: 8,
    marginTop: 40,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  containerTablet: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    marginHorizontal: 12,
    marginTop: 60,
    marginBottom: 32,
    borderRadius: 24,
  },
  containerSmall: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 6,
    marginTop: 30,
    marginBottom: 16,
    borderRadius: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarTablet: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarImageTablet: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarImageSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 6,
  },
  greetingTablet: {
    fontSize: 24,
    marginRight: 8,
  },
  greetingSmall: {
    fontSize: 16,
    marginRight: 4,
  },
  waveEmoji: {
    fontSize: 18,
  },
  waveEmojiTablet: {
    fontSize: 24,
  },
  waveEmojiSmall: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  subtitleTablet: {
    fontSize: 16,
    marginTop: 2,
  },
  subtitleSmall: {
    fontSize: 11,
    marginTop: 0,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonTablet: {
    width: 52,
    height: 52,
    borderRadius: 26,
    gap: 16,
  },
  iconButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    gap: 8,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeTablet: {
    top: -8,
    right: -8,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
  },
  notificationBadgeSmall: {
    top: -4,
    right: -4,
    borderRadius: 6,
    minWidth: 12,
    height: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  badgeTextTablet: {
    fontSize: 11,
  },
  badgeTextSmall: {
    fontSize: 7,
  },
  blurEffect: {
    position: 'absolute',
    bottom: -12,
    left: 0,
    right: 0,
    height: 18,
    zIndex: 10,
  },
});
