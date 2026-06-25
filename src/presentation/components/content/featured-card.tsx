import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Resource } from '@/domain/resource';
import { CONTENT_TYPE_LABEL, ContentTypeIcon } from '@/presentation/components/content-icons';
import { PlayIcon } from '@/presentation/components/icons';
import { Colors, Radius, Type } from '@/presentation/theme';

function isPlayable(type: Resource['type']): boolean {
  return type !== 'article' && type !== 'book';
}

/** The large "Featured" hero at the top of the Library. */
export function FeaturedCard({ resource, onPress }: { resource: Resource; onPress?: () => void }) {
  const subtitle = resource.people[0];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        <Image
          source={resource.imageUrl ? { uri: resource.imageUrl } : undefined}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
        {isPlayable(resource.type) ? (
          <View style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <PlayIcon size={18} color={Colors.white} />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.badgeRow}>
          <ContentTypeIcon type={resource.type} size={13} color={Colors.goldDeep} />
          <Text style={styles.kicker} numberOfLines={1}>
            {CONTENT_TYPE_LABEL[resource.type]}
            {subtitle ? <Text style={styles.kickerSubtle}>{`  ·  ${subtitle}`}</Text> : null}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={3}>
          {resource.title}
        </Text>
        {resource.excerpt ? (
          <Text style={styles.blurb} numberOfLines={2}>
            {resource.excerpt}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.borderSoft,
  },
  image: {
    width: '100%',
    height: '100%',
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
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(26,32,28,0.42)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  body: {
    padding: 17,
    gap: 9,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kicker: {
    ...Type.kicker,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  kickerSubtle: {
    color: Colors.textMuted,
  },
  title: {
    ...Type.title2,
    color: Colors.ink,
  },
  blurb: {
    ...Type.body,
    color: Colors.bodyText,
  },
});
