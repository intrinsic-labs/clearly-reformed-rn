import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronDownIcon } from '@/presentation/components/icons';
import type { MarkdownAction } from '@/presentation/lib/markdown-edit';
import { Colors, Fonts, Radius } from '@/presentation/theme';

interface ButtonSpec {
  readonly action: MarkdownAction;
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
    { action: 'quote', glyph: '“', label: 'Quote', style: 'symbol' },
  ],
];

/**
 * The note editor's formatting bar. Lives above the keyboard — on iOS inside an
 * `InputAccessoryView` (see `app/note-editor.tsx`), on Android in normal flow
 * under the resized window — so it is a plain row here with no positioning of
 * its own.
 */
export function MarkdownToolbar({
  active,
  onAction,
  onDismissKeyboard,
}: {
  active: readonly MarkdownAction[];
  onAction: (action: MarkdownAction) => void;
  onDismissKeyboard: () => void;
}) {
  return (
    <View style={styles.bar}>
      {GROUPS.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.group}>
          {groupIndex > 0 ? <View style={styles.divider} /> : null}
          {group.map((spec) => {
            const on = active.includes(spec.action);
            return (
              <Pressable
                key={spec.action}
                style={[styles.button, on && styles.buttonOn]}
                // Keep the input focused so the selection survives the tap.
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
    fontFamily: Fonts.serifBold,
    fontSize: 15,
  },
  bold: {
    fontFamily: Fonts.serifBold,
    fontSize: 17,
  },
  italic: {
    fontFamily: Fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 17,
  },
  symbol: {
    fontFamily: Fonts.serifBold,
    fontSize: 18,
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
