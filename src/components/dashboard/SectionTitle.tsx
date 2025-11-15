import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../config/constants';

interface SectionTitleProps {
  title: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '700',
  },
});
