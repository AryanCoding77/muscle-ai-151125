import React, { memo } from 'react';
import { Text, StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import { COLORS } from '../../config/constants';

interface ChipProps {
  label: string;
  color?: string; // background
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}

const ChipBase: React.FC<ChipProps> = ({ label, color = '#222229', textColor = COLORS.text, style }) => {
  return (
    <View style={[styles.chip, { backgroundColor: color, borderColor: COLORS.border }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

export const Chip = memo(ChipBase);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
