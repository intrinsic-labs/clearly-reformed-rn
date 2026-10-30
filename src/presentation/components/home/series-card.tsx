import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Resource } from '@/domain/resource';
import { Colors, Fonts, Radius, Type } from '@/presentation/theme';

const CARD_WIDTH = 236;
const CARD_HEIGHT = 300;

/**
 * A tall portrait card for Home's media rails — the per-type treatment the
 * website already uses. `video` sits on the dark Explainer band: the artwork
 * with the title set beneath a soft fade. `conference` is Coram Deo: the
 * speaker photo with a gradient foot carrying the name and session.
 */
export function SeriesCard({
  resource,
  kind,
  onPress,
}: {
  resource: Resource;
  kind: 'video' | 'conference';
  onPress: () => void;
}) {
  const speaker = resource.people[0];
  const isConference = kind === 'conference';

  return (
    <Pressable style={[styles.card, isConference ? styles.cardConference : styles.cardVideo]} onPress={onPress} accessibilityRole="button" testID="series-card">
      <Image
        source={resource.imageUrl ? { uri: resource.imageUrl } : undefined}
        style={styles.image}
        contentFit="cover"
        transition={150}
      />
      <LinearGradient
        colors={['rgba(20,26,22,0)', 'rgba(20,26,22,0.55)', 'rgba(20,26,22,0.92)']}
        locations={[0.35, 0.7, 1]}
        style={styles.fade}
      />
      <View style={styles.foot}>
        {isConference && speaker ? (
          <>
            <Text style={styles.speaker} numberOfLines={1}>
              {speaker}
            </Text>
            <Text style={styles.session} numberOfLines={2}>
              {resource.title}
            </Text>
          </>
        ) : (
          <Text style={styles.title} numberOfLines={3}>
            {resource.title}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  cardVideo: {
    backgroundColor: Colors.greenDeep,
  },
  cardConference: {
    backgroundColor: Colors.surface,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  fade: {
    ...StyleSheet.absoluteFill,
  },
  foot: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 3,
  },
  title: {
    ...Type.title3,
    fontSize: 20,
    lineHeight: 24,
    color: Colors.white,
  },
  speaker: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.white,
  },
  session: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.82)',
  },
});
