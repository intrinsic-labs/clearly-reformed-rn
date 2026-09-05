import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ArrowRightIcon } from '@/presentation/components/icons';
import { Colors, Fonts, Spacing, Type } from '@/presentation/theme';

/**
 * A Home section title in Flecha ("Explainer Series →") with an optional blurb.
 * When `onPress` is given the whole title row is a link, drawn with the arrow from
 * the Figma. `dark` flips the ink for the green Explainer band.
 */
export function SectionHeader({
  title,
  blurb,
  onPress,
  dark = false,
}: {
  title: string;
  blurb?: string;
  onPress?: () => void;
  dark?: boolean;
}) {
  const ink = dark ? Colors.onGreen : Colors.ink;
  const sub = dark ? Colors.onGreenMuted : Colors.textMuted;
  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.titleRow}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'link' : undefined}>
        <Text style={[styles.title, { color: ink }]}>{title}</Text>
        {onPress ? <ArrowRightIcon size={22} color={ink} /> : null}
      </Pressable>
      {blurb ? <Text style={[styles.blurb, { color: sub }]}>{blurb}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.xl,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
  },
  title: {
    ...Type.display,
    fontSize: 28,
    lineHeight: 34,
  },
  blurb: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
});
