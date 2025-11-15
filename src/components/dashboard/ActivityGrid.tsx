import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../config/constants';

interface ActivityGridProps {
  icons?: string[]; // emoji list
  size?: number;
  variant?: 'grid' | 'horizontal';
}

const DEFAULT_ICONS = ['🏃‍♂️','🏋️‍♂️','🧘‍♀️','🥊','🏊‍♂️','🚴‍♂️','🤸‍♀️','🤾‍♂️'];

const ActivityGridBase: React.FC<ActivityGridProps> = ({ icons = DEFAULT_ICONS, size = 48, variant = 'grid' }) => {
  if (variant === 'horizontal') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
        {icons.map((i, idx) => (
          <View key={idx} style={[styles.hItem, { width: size, height: size, borderRadius: size / 2 }]}> 
            <Text style={[styles.icon, { fontSize: size * 0.5 }]}>{i}</Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.grid}>
      {icons.slice(0, 8).map((i, idx) => (
        <View key={idx} style={[styles.item, { width: size, height: size, borderRadius: size / 2 }]}> 
          <Text style={[styles.icon, { fontSize: size * 0.5 }]}>{i}</Text>
        </View>
      ))}
    </View>
  );
};

export const ActivityGrid = memo(ActivityGridBase);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  item: {
    backgroundColor: '#222229',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    marginBottom: 10,
  },
  hRow: {
    alignItems: 'center',
    paddingVertical: 4,
    gap: 10,
    paddingRight: 4,
  },
  hItem: {
    backgroundColor: '#222229',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  icon: {
    fontSize: 24,
  },
});
