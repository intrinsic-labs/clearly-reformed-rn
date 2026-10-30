import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Resource } from '@/domain/resource';
import { CONTENT_TYPE_LABEL } from '@/presentation/lib/content-type';
import { Colors, Fonts, Radius, Spacing, Type } from '@/presentation/theme';

/**
 * The large hero card: a rounded image, then a plain type label, a Flecha headline,
 * and the blurb — borderless on the white page, per the Figma. An optional `pill`
 * ("Today's Pick") floats over the image's bottom-left corner; it replaces the old
 * full-width "Today's pick from the Clearly Reformed library" sentence.
 */
export function FeaturedCard({
  resource,
  pill,
  onPress,
  testID,
}: {
  resource: Resource;
  /** Short badge text drawn over the image, e.g. "Today's Pick". */
  pill?: string;
  onPress?: () => void;
  testID?: string;
}) {
  const subtitle = resource.people[0];

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button" testID={testID}>
      <View style={styles.imageWrap}>
        <Image
          source={resource.imageUrl ? { uri: resource.imageUrl } : undefined}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
        {pill ? (
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>{pill}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.kicker} numberOfLines={1}>
          {CONTENT_TYPE_LABEL[resource.type]}
          {subtitle ? `  ·  ${subtitle}` : ''}
        </Text>
        <Text style={styles.title} numberOfLines={3}>
          {resource.title}
        </Text>
        {resource.excerpt ? (
          <Text style={styles.blurb} numberOfLines={3}>
            {resource.excerpt}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pill: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: Colors.white,
    borderRadius: Radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pillLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.ink,
  },
  body: {
    paddingHorizontal: 6,
    gap: 6,
  },
  kicker: {
    ...Type.kicker,
    color: Colors.textMuted,
  },
  title: {
    ...Type.title2,
    color: Colors.ink,
  },
  blurb: {
    ...Type.body,
    color: Colors.bodyText,
    marginTop: 2,
  },
});
