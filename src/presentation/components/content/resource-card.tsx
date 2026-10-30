import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Resource } from '@/domain/resource';
import { CONTENT_TYPE_LABEL, showsDate } from '@/presentation/lib/content-type';
import { shortDate } from '@/presentation/lib/format';
import { Colors, Radius, Spacing, Type } from '@/presentation/theme';

/**
 * A row in a resource list: square thumbnail, plain type label, Flecha title
 * (two lines), and — only for dated types — the publish date. No dividers,
 * no glyphs, no play overlay: the Figma keeps rows quiet and lets spacing separate them.
 */
export function ResourceCard({ resource, onPress }: { resource: Resource; onPress?: () => void }) {
  const meta = showsDate(resource.type) ? shortDate(resource.displayDate) : null;

  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" testID="resource-card">
      <Image
        source={resource.thumbnailUrl ? { uri: resource.thumbnailUrl } : undefined}
        style={styles.thumb}
        contentFit="cover"
        transition={150}
      />

      <View style={styles.body}>
        <Text style={styles.kicker}>{CONTENT_TYPE_LABEL[resource.type]}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {resource.title}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: 11,
  },
  thumb: {
    width: 84,
    height: 84,
    flexShrink: 0,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  kicker: {
    ...Type.kicker,
    color: Colors.textMuted,
  },
  title: {
    ...Type.title3,
    color: Colors.ink,
  },
  meta: {
    ...Type.meta,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
