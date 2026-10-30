import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ContinueItem } from '@/domain/progress';
import { CONTENT_TYPE_LABEL } from '@/presentation/lib/content-type';
import { formatTime } from '@/presentation/lib/format';
import { Colors, Radius, Type } from '@/presentation/theme';

/** ~Reading speed for converting remaining characters to minutes (chars→words→200wpm). */
const CHARS_PER_MINUTE = 6 * 200;

function progressLabel(item: ContinueItem): string {
  const { kind, position, length, fraction } = item.progress;
  switch (kind) {
    case 'read': {
      const minutesLeft = Math.max(1, Math.ceil((length - position) / CHARS_PER_MINUTE));
      return `${Math.round(fraction * 100)}% · ${minutesLeft} min left`;
    }
    case 'listen':
      return `${formatTime(position)} / ${formatTime(length)}`;
    case 'watch':
      return `${Math.max(1, Math.ceil((length - position) / 60))} min left`;
  }
}

/** A card in Home's horizontal Continue rail: image, type, title, and a gold progress bar. */
export function ContinueCard({ item, onPress }: { item: ContinueItem; onPress: () => void }) {
  const { resource, fraction } = item.progress;

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button" testID="continue-card">
      <Image
        source={resource.thumbnailUrl ? { uri: resource.thumbnailUrl } : undefined}
        style={styles.image}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.body}>
        <Text style={styles.kicker}>{CONTENT_TYPE_LABEL[resource.type]}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {resource.title}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(fraction * 100)}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{progressLabel(item)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 232,
    gap: 10,
  },
  image: {
    width: '100%',
    height: 130,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  body: {
    paddingHorizontal: 2,
  },
  kicker: {
    ...Type.kicker,
    color: Colors.textMuted,
  },
  title: {
    ...Type.cardTitle,
    color: Colors.ink,
    marginTop: 3,
    marginBottom: 10,
    minHeight: 42,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.borderSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  progressLabel: {
    ...Type.meta,
    color: Colors.textMuted,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
});
