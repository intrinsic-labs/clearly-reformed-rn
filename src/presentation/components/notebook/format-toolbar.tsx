import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleState } from 'react-native-enriched-markdown';

import { ChevronDownIcon } from '@/presentation/components/icons';
import { Colors, Fonts, Radius } from '@/presentation/theme';

export type FormatAction = 'h1' | 'h2' | 'h3' | 'bold' | 'italic' | 'bullet' | 'ordered';

interface ButtonSpec {
  readonly action: FormatAction;
  readonly glyph: string;
  readonly label: string;
  readonly style?: 'heading' | 'bold' | 'italic' | 'symbol';
}

const GROUPS: readonly (readonly ButtonSpec[])[] = [
  [
    { action: 'h1', glyph: 'H1', label: 'Heading 1', style: 'heading' },
    { action: 'h2', glyph: 'H2', label: 'Heading 2', style: 'heading' },
    { action: 'h3', glyph: 'H3', label: 'Heading 3', style: 'heading' },
  ],
  [
    { action: 'bold', glyph: 'B', label: 'Bold', style: 'bold' },
    { action: 'italic', glyph: 'I', label: 'Italic', style: 'italic' },
  ],
  [
    { action: 'bullet', glyph: '•', label: 'Bulleted list', style: 'symbol' },
    { action: 'ordered', glyph: '1.', label: 'Numbered list', style: 'symbol' },
  ],
];

function isActive(state: StyleState | null, action: FormatAction): boolean {
  if (!state) return false;
  switch (action) {
    case 'h1':
    case 'h2':
    case 'h3':
      return state.heading.isActive && state.heading.level === Number(action[1]);
    case 'bold':
      return state.bold.isActive;
    case 'italic':
      return state.italic.isActive;
    case 'bullet':
      return state.unorderedList.isActive;
    case 'ordered':
      return state.orderedList.isActive;
  }
}

/**
 * The note editor's formatting bar — plain buttons that toggle live styling on
 * the rich-text input (no markup ever shown to the user). Sits at the bottom of
 * the editor layout, riding the keyboard inset; it is a plain row here with no
 * positioning of its own.
 */
export function FormatToolbar({
  state,
  onAction,
  onDismissKeyboard,
}: {
  state: StyleState | null;
  onAction: (action: FormatAction) => void;
  onDismissKeyboard: () => void;
}) {
  return (
    <View style={styles.bar}>
      {GROUPS.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.group}>
          {groupIndex > 0 ? <View style={styles.divider} /> : null}
          {group.map((spec) => {
            const on = isActive(state, spec.action);
            return (
              <Pressable
                key={spec.action}
                style={[styles.button, on && styles.buttonOn]}
                onPress={() => onAction(spec.action)}
                accessibilityRole="button"
                accessibilityLabel={spec.label}
                accessibilityState={{ selected: on }}>
                <Text style={[styles.glyph, glyphStyles[spec.style ?? 'symbol'], on && styles.glyphOn]}>
                  {spec.glyph}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.spacer} />
      <Pressable
        style={styles.button}
        onPress={onDismissKeyboard}
        accessibilityRole="button"
        accessibilityLabel="Hide keyboard">
        <ChevronDownIcon size={19} color={Colors.inkSoft} />
      </Pressable>
    </View>
  );
}

const glyphStyles = StyleSheet.create({
  heading: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
  },
  bold: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
  },
  italic: {
    fontFamily: Fonts.sansItalic,
    fontSize: 16,
  },
  symbol: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
  },
});

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderChrome,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: 7,
  },
  button: {
    minWidth: 38,
    height: 36,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOn: {
    backgroundColor: Colors.green,
  },
  spacer: {
    flex: 1,
  },
  glyph: {
    color: Colors.inkSoft,
    // The glyphs are cap-height letters; nudge the optical centre.
    includeFontPadding: false,
  },
  glyphOn: {
    color: Colors.onGreen,
  },
});
