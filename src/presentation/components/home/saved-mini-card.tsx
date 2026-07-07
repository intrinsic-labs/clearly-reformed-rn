import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ResourceRef } from '@/domain/resource-ref';
import { CONTENT_TYPE_LABEL, ContentTypeIcon } from '@/presentation/components/content-icons';
import { Colors, Type } from '@/presentation/theme';

/** Compact card in Home's "From your notebook" rail (recently saved items). */
export function SavedMiniCard({ resource, onPress }: { resource: ResourceRef; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {resource.thumbnailUrl ? (
        <Image source={{ uri: resource.thumbnailUrl }} style={styles.image} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.image, { backgroundColor: Colors.borderSoft }]} />
      )}
      <View style={styles.body}>
        <View style={styles.kickerRow}>
          <ContentTypeIcon type={resource.type} size={11} />
          <Text style={styles.kicker}>{CONTENT_TYPE_LABEL[resource.type]}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {resource.title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 172,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 108,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 13,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  kicker: {
    ...Type.kicker,
    fontSize: 9.5,
    color: Colors.textMuted,
  },
  title: {
    ...Type.cardTitle,
    fontSize: 14.5,
    lineHeight: 17.5,
    color: Colors.ink,
  },
});
