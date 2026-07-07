import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Resource } from '@/domain/resource';
import { CONTENT_TYPE_LABEL, ContentTypeIcon } from '@/presentation/components/content-icons';
import { PlayIcon } from '@/presentation/components/icons';
import { Colors, Fonts, Type } from '@/presentation/theme';

/** The "Today" hero on Home: image, kicker, Flecha headline, blurb, and the why-row. */
export function TodayCard({ resource, onPress }: { resource: Resource; onPress: () => void }) {
  const playable = resource.type !== 'article' && resource.type !== 'book';
  const subtitle = resource.people[0];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View>
        {resource.imageUrl ? (
          <Image source={{ uri: resource.imageUrl }} style={styles.hero} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.hero, { backgroundColor: Colors.borderSoft }]} />
        )}
        {playable ? (
          <View style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <PlayIcon size={16} color={Colors.white} />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.kickerRow}>
          <ContentTypeIcon type={resource.type} size={14} />
          <Text style={styles.kicker}>{CONTENT_TYPE_LABEL[resource.type]}</Text>
          {subtitle ? (
            <>
              <Text style={styles.kickerDot}>·</Text>
              <Text style={styles.kickerSub} numberOfLines={1}>
                {subtitle}
              </Text>
            </>
          ) : null}
        </View>
        <Text style={styles.title}>{resource.title}</Text>
        {resource.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={3}>
            {resource.excerpt}
          </Text>
        ) : null}
        <View style={styles.divider} />
        <View style={styles.whyRow}>
          <View style={styles.whyDot} />
          <Text style={styles.whyText}>
            Today’s pick from the <Text style={styles.whyStrong}>Clearly Reformed</Text> library
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2E3A33',
    shadowOpacity: 0.14,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 14 },
  },
  hero: {
    width: '100%',
    height: 200,
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
    borderRadius: 28,
    backgroundColor: 'rgba(26,32,28,0.42)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  body: {
    paddingHorizontal: 17,
    paddingTop: 16,
    paddingBottom: 17,
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
  kickerDot: {
    color: '#CBC1AC',
  },
  kickerSub: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  title: {
    ...Type.title2,
    color: Colors.ink,
    marginTop: 9,
  },
  excerpt: {
    ...Type.body,
    color: Colors.bodyText,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSoft,
    marginTop: 15,
    marginBottom: 12,
  },
  whyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  whyText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: '#8A8071',
  },
  whyStrong: {
    fontFamily: Fonts.sansMedium,
    color: Colors.inkSoft,
  },
});
