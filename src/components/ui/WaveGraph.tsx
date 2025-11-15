import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface WaveGraphProps {
  color: string;
  width?: number;
  height?: number;
  style?: any;
}

export const WaveGraph: React.FC<WaveGraphProps> = ({ 
  color, 
  width = 80, 
  height = 30, 
  style 
}) => {
  const wavePath = `M0,${height/2} Q${width/4},${height/4} ${width/2},${height/2} T${width},${height/2}`;
  
  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={wavePath}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
