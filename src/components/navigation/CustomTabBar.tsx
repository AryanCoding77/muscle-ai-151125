import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../config/constants';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
type IconName = React.ComponentProps<typeof Icon>['name'];
const TAB_META: Record<string, { label: string; active: IconName; inactive: IconName }> = {
  Home: { label: 'Home', active: 'home', inactive: 'home-outline' },
  Analyze: { label: 'Analyze', active: 'magnify', inactive: 'magnify' },
  Progress: { label: 'Progress', active: 'chart-line', inactive: 'chart-line' },
  Profile: { label: 'Profile', active: 'account', inactive: 'account-outline' },
};

function CustomTabBarBase({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View style={[
      styles.wrapper,
      { paddingBottom: bottomInset }
    ]}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true } as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const meta = TAB_META[route.name] ?? { label: route.name, active: 'circle', inactive: 'circle-outline' };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? `${meta.label} tab`}
              style={({ pressed }) => [
                styles.item,
                isFocused && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
            >
              <Icon
                name={isFocused ? meta.active : meta.inactive}
                size={22}
                color={isFocused ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.label, { color: isFocused ? COLORS.text : COLORS.textSecondary }]}> 
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const CustomTabBar = memo(CustomTabBarBase);

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -2 },
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 0,
    marginTop: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  itemActive: {
    backgroundColor: '#2A2A2D', // subtle contrast against surface
  },
  itemPressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
