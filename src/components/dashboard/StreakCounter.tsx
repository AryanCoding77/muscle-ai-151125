import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Card } from '../ui/Card';
import { COLORS } from '../../config/constants';
import { useStreak } from '../../hooks/useStreak';

interface StreakCounterProps {
  style?: any;
  onPress?: () => void;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ style, onPress }) => {
  const { 
    streakData, 
    loading, 
    milestones, 
    nextMilestone, 
    motivation, 
    isActive, 
    latestMilestone 
  } = useStreak();

  const handlePress = async () => {
    if (onPress) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getStreakIcon = () => {
    if (!isActive) return '🔥';
    if (streakData.currentStreak >= 100) return '👑';
    if (streakData.currentStreak >= 30) return '🏆';
    if (streakData.currentStreak >= 7) return '⚡';
    return '🔥';
  };

  return (
    <Card style={[styles.card, style]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={!onPress}
        style={styles.touchable}
      >
        {/* Header - Title and Icon */}
        <View style={styles.header}>
          <Text style={styles.label}>Current Streak</Text>
          <Text style={styles.icon}>{getStreakIcon()}</Text>
        </View>

        {/* Value Section */}
        <View style={styles.valueContainer}>
          <Text style={styles.value}>
            {loading ? '...' : streakData.currentStreak}
          </Text>
          <Text style={styles.unit}>
            {streakData.currentStreak === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  touchable: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  icon: {
    fontSize: 22,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 36,
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});
