import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GearIcon, LogoMark, SearchIcon } from '@/presentation/components/icons';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

const ACTION_BUTTON_SIZE = 38;
const ACTION_SLOT_WIDTH = ACTION_BUTTON_SIZE * 2 + Spacing.sm;

/**
 * Shared top app bar used on every tab: the gold Clearly Reformed mark + a
 * wordmark in Flecha Regular, with a search affordance on the right. Only the
 * title text changes per tab ("Clearly Reformed" on Home, the tab name elsewhere).
 */
export function AppHeader({
  title,
  showSearch = true,
  showSettings = false,
}: {
  title: string;
  showSearch?: boolean;
  showSettings?: boolean;
}) {
  const router = useRouter();

  return (
    <View style={styles.appBar}>
      <View style={styles.brand}>
        <LogoMark size={30} />
        <Text style={styles.wordmark}>{title}</Text>
      </View>
      <View style={styles.actions}>
        {showSettings ? (
          <Pressable
            style={styles.searchButton}
            onPress={() => router.push('/settings')}
            hitSlop={6}
            accessibilityLabel="Settings">
            <GearIcon size={18} color={Colors.inkSoft} />
          </Pressable>
        ) : null}
        {showSearch ? (
          <Pressable
            style={styles.searchButton}
            onPress={() => router.navigate('/search')}
            hitSlop={6}
            accessibilityLabel="Search">
            <SearchIcon size={18} color={Colors.inkSoft} weight={1.8} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: 6,
    paddingBottom: Spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actions: {
    width: ACTION_SLOT_WIDTH,
    minHeight: ACTION_BUTTON_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  wordmark: {
    fontFamily: Fonts.serif,
    fontSize: 21,
    color: Colors.ink,
    letterSpacing: 0.2,
  },
  searchButton: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
