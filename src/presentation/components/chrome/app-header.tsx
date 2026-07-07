import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LogoMark, SearchIcon } from '@/presentation/components/icons';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

/**
 * Shared top app bar used on every tab: the gold Clearly Reformed mark + a
 * wordmark in Flecha Regular, with a search affordance on the right. Only the
 * title text changes per tab ("Clearly Reformed" on Home, the tab name elsewhere).
 */
export function AppHeader({ title, showSearch = true }: { title: string; showSearch?: boolean }) {
  const router = useRouter();

  return (
    <View style={styles.appBar}>
      <View style={styles.brand}>
        <LogoMark size={30} />
        <Text style={styles.wordmark}>{title}</Text>
      </View>
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
  wordmark: {
    fontFamily: Fonts.serif,
    fontSize: 21,
    color: Colors.ink,
    letterSpacing: 0.2,
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
