import { ScrollView, StyleSheet, View } from 'react-native';

import type { Resource } from '@/domain/resource';
import { SectionHeader } from '@/presentation/components/home/section-header';
import { SeriesCard } from '@/presentation/components/home/series-card';
import { Colors, Spacing } from '@/presentation/theme';

/**
 * A horizontally scrolling rail of tall media cards with a linked title. The
 * Explainer Series rail is a full-bleed dark band (`dark`); Coram Deo sits on white.
 */
export function SeriesRail({
  title,
  blurb,
  items,
  kind,
  dark = false,
  onPressTitle,
  onPressItem,
  testID,
}: {
  title: string;
  blurb?: string;
  items: readonly Resource[];
  kind: 'video' | 'conference';
  dark?: boolean;
  onPressTitle: () => void;
  onPressItem: (item: Resource) => void;
  testID?: string;
}) {
  if (items.length === 0) return null;
  return (
    <View style={[styles.section, dark ? styles.sectionDark : null]} testID={testID}>
      <SectionHeader title={title} blurb={blurb} onPress={onPressTitle} dark={dark} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {items.map((item) => (
          <SeriesCard key={`${item.type}-${item.id}`} resource={item} kind={kind} onPress={() => onPressItem(item)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: Spacing.xxl,
    gap: Spacing.lg,
  },
  sectionDark: {
    backgroundColor: Colors.greenDeep,
  },
  rail: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
});
