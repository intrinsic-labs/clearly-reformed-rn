import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/presentation/components/chrome/mini-player';
import { useNowPlaying } from '@/presentation/playback/use-now-playing';
import { nativeTabBarHeight, supportsTabBarAccessory } from '@/presentation/lib/platform';
import { Spacing } from '@/presentation/theme';

/** Height the floating mini-player occupies above the tab bar (pill + gap). */
export const FLOATING_MINI_PLAYER_HEIGHT = 58 + Spacing.sm;

/**
 * The mini-player inside the iOS 26 tab-bar accessory. The system draws the glass
 * capsule and tells us whether it is riding above the full tab bar ("regular") or
 * tucked beside the minimised one ("inline").
 *
 * Render it inside `<NativeTabs.BottomAccessory>` placed *directly* under
 * `<NativeTabs>` — the navigator finds the accessory by element type, so a
 * wrapper component would hide it.
 */
export function AccessoryMiniPlayer() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return <MiniPlayer variant={placement === 'inline' ? 'accessory-inline' : 'accessory'} />;
}

/**
 * Fallback for Android and iOS < 26: the mini-player floats as a pill just above
 * the native tab bar. Rendered as a sibling of `NativeTabs`, absolutely positioned.
 */
export function FloatingMiniPlayer() {
  const insets = useSafeAreaInsets();
  if (supportsTabBarAccessory()) return null;
  return (
    <View pointerEvents="box-none" style={[styles.floating, { bottom: nativeTabBarHeight() + insets.bottom + Spacing.sm }]}>
      <MiniPlayer variant="floating" />
    </View>
  );
}

/**
 * Extra bottom padding a scrolling tab screen needs so its last row clears the
 * floating mini-player. Zero when the accessory handles it (iOS 26) or nothing is
 * playing.
 */
export function useBottomChromeInset(): number {
  const { playable } = useNowPlaying();
  if (!playable || supportsTabBarAccessory()) return 0;
  return FLOATING_MINI_PLAYER_HEIGHT;
}

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
  },
});
