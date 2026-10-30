import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LogoMark, PersonIcon } from '@/presentation/components/icons';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

const ACTION_BUTTON_SIZE = 38;

/**
 * Shared top app bar on every tab: the gold mark + a Flecha wordmark on the left,
 * and the account/settings entry (a person in a ring, per the Figma) on the right.
 * Search no longer lives here — it is a tab, reachable from anywhere.
 */
export function AppHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <View style={styles.appBar} testID="shell-header">
      <View style={styles.brand}>
        <LogoMark size={30} />
        <Text style={styles.wordmark}>{title}</Text>
      </View>
      <Pressable
        style={styles.actionButton}
        onPress={() => router.push('/settings')}
        testID="shell-header-settings"
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Account and settings">
        <PersonIcon size={18} color={Colors.inkSoft} />
      </Pressable>
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
  actionButton: {
    width: ACTION_BUTTON_SIZE,
    height: ACTION_BUTTON_SIZE,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
