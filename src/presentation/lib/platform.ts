import { Platform } from 'react-native';

/** iOS major version, or 0 elsewhere. */
export function iosMajorVersion(): number {
  if (Platform.OS !== 'ios') return 0;
  const major = parseInt(String(Platform.Version), 10);
  return Number.isFinite(major) ? major : 0;
}

/**
 * Whether the native tab bar can host a bottom accessory (the Apple Music-style
 * capsule that rides above — and minimises with — the Liquid Glass tab bar).
 * Introduced in iOS 26; everywhere else the mini-player floats as an overlay.
 */
export function supportsTabBarAccessory(): boolean {
  return iosMajorVersion() >= 26;
}

/**
 * Height of the native tab bar, excluding the bottom safe-area inset. Used only
 * by the floating mini-player fallback to sit just above the bar.
 */
export function nativeTabBarHeight(): number {
  return Platform.OS === 'android' ? 80 : 49;
}
