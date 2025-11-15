import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import { COLORS } from '../../config/constants';

interface RingStatProps {
  label: string;
  value: number; // 0..1
  display?: string; // e.g. "6 days"
  color?: string;
  size?: number; // px
  style?: StyleProp<ViewStyle>;
}

const RingStatComponent: React.FC<RingStatProps> = ({ label, value, display, color = COLORS.primary, size = 110, style }) => {
  const clamped = Math.max(0, Math.min(1, value));
  const chartData = useMemo(() => ({ data: [clamped] }), [clamped]);
  const valueFont = useMemo(() => Math.max(14, Math.round(size * 0.14)), [size]);
  const strokeWidth = useMemo(() => Math.max(4, Math.round(size * 0.06)), [size]);
  const radius = useMemo(() => Math.max(20, Math.round(size / 2 - strokeWidth - 4)), [size, strokeWidth]);
  const chartConfig = useMemo(() => ({
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    color: () => color,
    strokeWidth: strokeWidth,
    propsForBackgroundLines: {
      strokeWidth: 0,
    },
  }), [color, strokeWidth]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.center}>
        <ProgressChart
          data={chartData}
          width={size}
          height={size}
          strokeWidth={strokeWidth}
          radius={radius}
          hideLegend
          chartConfig={chartConfig}
        />
        <View style={[styles.overlay, { width: size, height: size }]} pointerEvents="none">
          <Text style={[styles.value, { fontSize: valueFont }]}>{display ?? `${Math.round(value * 100)}%`}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

export const RingStat = memo(RingStatComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: COLORS.text,
    fontWeight: '600',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
