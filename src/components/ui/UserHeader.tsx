import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { COLORS } from '../../config/constants';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface UserHeaderProps {
  userName?: string;
  subtitle?: string; // e.g., "Get ready"
  location?: string; // kept for backward-compat; ignored if subtitle provided
  profileImage?: any;
  onBellPress?: () => void;
  onSettingsPress?: () => void;
  showNotificationDot?: boolean;
  topOffset?: number; // extra spacing below status bar
}

export const UserHeader: React.FC<UserHeaderProps> = ({ 
  userName = 'Emma',
  subtitle = 'Get ready',
  location,
  profileImage = require('../../../assets/icon.png'),
  onBellPress,
  onSettingsPress,
  showNotificationDot = true,
  topOffset = 16,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      styles.wrapper,
      { marginTop: Math.max(insets.top, 12) + topOffset }
    ]}>
      {/* Gradient background clipped to rounded container */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id="hdrGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#2A2A2D" />
            <Stop offset="100%" stopColor="#0B0B0C" />
          </SvgLinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" rx={28} ry={28} fill="url(#hdrGrad)" />
      </Svg>

      <View style={styles.contentRow}>
        {/* Left: Avatar + texts */}
        <View style={styles.leftRow}>
          <View style={styles.avatarRing}>
            <Image source={profileImage} style={styles.profileImage} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.greeting}>Hello {userName} 👋</Text>
            <Text style={styles.subtitle}>{subtitle ?? location}</Text>
          </View>
        </View>

        {/* Right: circular action buttons */}
        <View style={styles.actions}>
          <Pressable onPress={onBellPress} style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}>
            <Icon name="bell-outline" size={20} color="#FFFFFF" />
            {showNotificationDot && <View style={styles.redDot} />}
          </Pressable>
          <Pressable onPress={onSettingsPress} style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}>
            <Icon name="cog-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 4,
    marginTop: 0,
    borderRadius: 28,
    overflow: 'hidden',
    padding: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  textBlock: {
    flex: 1,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 12,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  btnPressed: {
    opacity: 0.85,
  },
  redDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});
