import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ResourceRef } from '@/domain/resource-ref';
import { CONTENT_TYPE_LABEL } from '@/presentation/lib/content-type';
import { Colors, Radius, Type } from '@/presentation/theme';

/** Compact card in Home's "Recently saved" rail. */
export function SavedMiniCard({ resource, onPress }: { resource: ResourceRef; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 168,
    gap: 8,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: Radius.md,
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
    fontSize: 16,
    lineHeight: 20,
    color: Colors.ink,
    marginTop: 2,
  },
});
