import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ResourceRef } from '@/domain/resource-ref';
import { CONTENT_TYPE_LABEL } from '@/presentation/components/content-icons';
import { ChevronRightIcon } from '@/presentation/components/icons';
import { Colors, Fonts, Radius } from '@/presentation/theme';

/** The "where this came from" footer row on notebook cards — taps through to the source. */
export function SourceRow({ resource, onPress }: { resource: ResourceRef; onPress?: () => void }) {
  const subtitle = [CONTENT_TYPE_LABEL[resource.type], resource.subtitle].filter(Boolean).join(' · ');
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      {resource.thumbnailUrl ? (
        <Image source={{ uri: resource.thumbnailUrl }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]} />
      )}
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {resource.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <ChevronRightIcon size={17} color={Colors.gold} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
  },
  thumbFallback: {
    backgroundColor: Colors.borderSoft,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: 13,
    lineHeight: 15.5,
    color: Colors.ink,
  },
  meta: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
