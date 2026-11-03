import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { SaveToggleResult } from '@/application/use-cases/saved';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

const VISIBLE_MS = 4000;

/**
 * A brief note under the top bar when a save went through but its body could
 * not be kept for offline reading — so a bookmark never implies an offline copy
 * that doesn't exist. Silent on success; that is the expected case.
 */
export function SaveOfflineNotice({ result, top }: { result: SaveToggleResult | undefined; top: number }) {
  // Each failed save is a new result object; it shows until its timer expires it.
  const [expired, setExpired] = useState<SaveToggleResult | null>(null);
  const failed = Boolean(result && result.saved && !result.offline);

  useEffect(() => {
    if (!failed || !result) return;
    const timer = setTimeout(() => setExpired(result), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [failed, result]);

  if (!failed || result === expired) return null;
  return (
    <View style={[styles.wrap, { top }]} pointerEvents="none" testID="save-offline-notice">
      <Text style={styles.text} accessibilityLiveRegion="polite">
        Saved, but not available offline yet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: Colors.ink,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  text: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.white,
  },
});
