import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({ size = 60, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../../assets/icon.png')}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: 8,
  },
});
