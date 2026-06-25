import { StyleSheet, Text, View } from 'react-native';

import type { ContentType } from '@/domain/resource';
import { CONTENT_TYPE_LABEL, ContentTypeIcon } from '@/presentation/components/content-icons';
import { Colors, Type } from '@/presentation/theme';

/** Gold content-type glyph + uppercase kicker label (e.g. "📖 ARTICLE"). */
export function TypeBadge({ type, iconSize = 13 }: { type: ContentType; iconSize?: number }) {
  return (
    <View style={styles.row}>
      <ContentTypeIcon type={type} size={iconSize} color={Colors.goldDeep} />
      <Text style={styles.label}>{CONTENT_TYPE_LABEL[type]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...Type.kicker,
    color: Colors.textMuted,
  },
});
