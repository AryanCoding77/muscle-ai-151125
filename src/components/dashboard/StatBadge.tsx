import React, { memo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Card } from '../ui/Card';
import { COLORS } from '../../config/constants';

interface StatBadgeProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string; // emoji or small text icon
  style?: StyleProp<ViewStyle>;
  valueColor?: string; // custom color for the value text
}

const StatBadgeComponent: React.FC<StatBadgeProps> = ({ label, value, unit, icon, style, valueColor }) => {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {!!icon && <Text style={styles.icon}>{icon}</Text>}
      </View>
      <View style={styles.bottomRow}>
        <Text style={[styles.value, valueColor && { color: valueColor }]}>{value}</Text>
        {!!unit && <Text style={styles.unit}> {unit}</Text>}
      </View>
    </Card>
  );
};

export const StatBadge = memo(StatBadgeComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  icon: {
    fontSize: 24,
  },
  value: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  unit: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: 4,
  },
});
