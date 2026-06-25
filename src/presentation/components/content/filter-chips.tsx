import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import type { ContentType } from '@/domain/resource';
import { Colors, Radius, Spacing, Type } from '@/presentation/theme';

/** The active Library filter: a content type, or "all". */
export type ContentFilter = ContentType | 'all';

type ChipOption = { label: string; value: ContentFilter };

/** The chip row from the mockup (a curated subset of types; the rest still show under "All"). */
const CHIP_OPTIONS: readonly ChipOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Articles', value: 'article' },
  { label: 'Videos', value: 'video' },
  { label: 'Podcast', value: 'podcast' },
  { label: 'Sermons', value: 'sermon' },
  { label: 'Lectures', value: 'lecture' },
  { label: 'Conference', value: 'conference' },
];

export function FilterChips({ value, onChange }: { value: ContentFilter; onChange: (value: ContentFilter) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {CHIP_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
            <Text style={[styles.label, active ? styles.labelActive : styles.labelIdle]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  chipIdle: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  label: {
    ...Type.label,
    fontSize: 13,
  },
  labelActive: {
    color: Colors.onGreen,
  },
  labelIdle: {
    color: Colors.inkSoft,
  },
});
