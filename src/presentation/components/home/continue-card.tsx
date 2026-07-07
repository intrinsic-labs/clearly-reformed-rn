import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ContinueItem } from '@/domain/progress';
import { CONTENT_TYPE_LABEL, ContentTypeIcon } from '@/presentation/components/content-icons';
import { PlayIcon } from '@/presentation/components/icons';
import { formatTime } from '@/presentation/lib/format';
import { Colors, Type } from '@/presentation/theme';

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

/** A card in Home's horizontal Continue rail. */
export function ContinueCard({ item, onPress }: { item: ContinueItem; onPress: () => void }) {
  const { resource, kind, fraction } = item.progress;
  const playable = kind !== 'read';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View>
        {resource.thumbnailUrl ? (
          <Image source={{ uri: resource.thumbnailUrl }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.image, { backgroundColor: Colors.borderSoft }]} />
        )}
        {playable ? (
          <View style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <PlayIcon size={12} color={Colors.white} />
            </View>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.kickerRow}>
          <ContentTypeIcon type={resource.type} size={12} />
          <Text style={styles.kicker}>{CONTENT_TYPE_LABEL[resource.type]}</Text>
        </View>
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
    width: 236,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(26,32,28,0.42)',
    borderWidth: 1.4,
    borderColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  body: {
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 13,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kicker: {
    ...Type.kicker,
    color: Colors.textMuted,
  },
  title: {
    ...Type.cardTitle,
    color: Colors.ink,
    marginTop: 8,
    marginBottom: 12,
    minHeight: 38,
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
    marginTop: 7,
    fontVariant: ['tabular-nums'],
  },
});
