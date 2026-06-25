import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Resource } from '@/domain/resource';
import { TypeBadge } from '@/presentation/components/content/type-badge';
import { PlayIcon } from '@/presentation/components/icons';
import { shortDate } from '@/presentation/lib/format';
import { Colors, Radius, Spacing, Type } from '@/presentation/theme';

/** Content types that play media (get a play affordance on the thumbnail). */
function isPlayable(type: Resource['type']): boolean {
  return type !== 'article' && type !== 'book';
}

/** A row in the "All Resources" list: thumbnail + type badge + Flecha title + date. */
export function ResourceCard({ resource, onPress }: { resource: Resource; onPress?: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.thumbWrap}>
        <Image
          source={resource.imageUrl ? { uri: resource.imageUrl } : undefined}
          style={styles.thumb}
          contentFit="cover"
          transition={150}
        />
        {isPlayable(resource.type) ? (
          <View style={styles.playBadge}>
            <View style={styles.playCircle}>
              <PlayIcon size={11} color={Colors.white} />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <TypeBadge type={resource.type} iconSize={12} />
        <Text style={styles.title} numberOfLines={2}>
          {resource.title}
        </Text>
        <Text style={styles.meta}>{shortDate(resource.displayDate)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  thumbWrap: {
    width: 104,
    height: 74,
    flexShrink: 0,
  },
  thumb: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
    backgroundColor: Colors.borderSoft,
  },
  playBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(26,32,28,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  title: {
    ...Type.title3,
    color: Colors.ink,
  },
  meta: {
    ...Type.meta,
    color: Colors.textMuted,
  },
});
