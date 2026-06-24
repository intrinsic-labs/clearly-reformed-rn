import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/chrome/mini-player';
import { HomeIcon, IconProps, LibraryIcon, NotebookIcon, SearchIcon } from '@/components/icons';
import { Colors, Fonts, Spacing } from '@/constants/theme';

/** The props expo-router hands its `tabBar` render prop (uses the vendored react-navigation types). */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, (p: IconProps) => React.ReactNode> = {
  index: HomeIcon,
  library: LibraryIcon,
  search: SearchIcon,
  notebook: NotebookIcon,
};

const LABELS: Record<string, string> = {
  index: 'Home',
  library: 'Library',
  search: 'Search',
  notebook: 'Notebook',
};

/**
 * The bottom chrome: the persistent mini-player stacked directly on top of a
 * custom cream tab bar (gold active state), matching the mockups. Rendered via
 * the Tabs `tabBar` prop so we control the full bar (NativeTabs can't stack the player).
 */
export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View>
      <MiniPlayer />

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = ICONS[route.name];
          const color = focused ? Colors.gold : Colors.textMuted;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} style={styles.tab} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: focused }}>
              {Icon ? Icon({ size: 23, color }) : null}
              <Text style={[styles.label, { color }]}>{LABELS[route.name] ?? route.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderChrome,
    paddingTop: 9,
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 0.1,
  },
});
