import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS } from '../../config/constants';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const CardBase: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

export const Card = memo(CardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
});
