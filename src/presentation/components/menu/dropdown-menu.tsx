import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ChevronDownSmallIcon } from '@/presentation/components/icons';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

export interface MenuOption<T extends string> {
  readonly value: T;
  readonly label: string;
  /** Greyed out and unselectable; `hint` explains why. */
  readonly disabled?: boolean;
  readonly hint?: string;
}

const MENU_MIN_WIDTH = 168;
const MENU_GAP = 6;

/**
 * A pill trigger ("All Resources ⌄") that opens a small anchored menu beneath it —
 * the Library's type and sort pickers from the Figma. The menu is a transparent
 * Modal so it floats over list content; tapping outside dismisses it.
 */
export function DropdownMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  testID,
}: {
  /** Text shown in the trigger; usually the selected option's label. */
  label: string;
  value: T;
  options: readonly MenuOption<T>[];
  onChange: (value: T) => void;
  /** Lands on the trigger; each option gets `<testID>-option-<value>`. */
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const triggerRef = useRef<View>(null);
  const window = useWindowDimensions();

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  const menuWidth = Math.max(MENU_MIN_WIDTH, anchor?.width ?? 0);
  // Right-align the menu to the trigger, but keep it on screen.
  const left = anchor ? Math.max(Spacing.md, Math.min(anchor.x + anchor.width - menuWidth, window.width - menuWidth - Spacing.md)) : 0;
  const top = anchor ? anchor.y + anchor.height + MENU_GAP : 0;

  return (
    <>
      <Pressable
        ref={triggerRef}
        style={({ pressed }) => [styles.trigger, pressed ? styles.triggerPressed : null]}
        onPress={openMenu}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}. Opens a menu.`}>
        <Text style={styles.triggerLabel} numberOfLines={1}>
          {label}
        </Text>
        <ChevronDownSmallIcon size={14} color={Colors.inkSoft} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)} accessibilityLabel="Close menu">
          <View style={[styles.menu, { left, top, width: menuWidth }]}>
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  disabled={option.disabled}
                  onPress={() => {
                    setOpen(false);
                    if (!selected) onChange(option.value);
                  }}
                  style={({ pressed }) => [styles.item, pressed ? styles.itemPressed : null]}
                  testID={testID ? `${testID}-option-${option.value}` : undefined}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected, disabled: option.disabled }}>
                  <Text
                    style={[
                      styles.itemLabel,
                      selected ? styles.itemLabelSelected : null,
                      option.disabled ? styles.itemLabelDisabled : null,
                    ]}>
                    {option.label}
                  </Text>
                  {option.disabled && option.hint ? <Text style={styles.itemHint}>{option.hint}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
  },
  triggerPressed: {
    opacity: 0.7,
  },
  triggerLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12.5,
    color: Colors.ink,
  },
  scrim: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  itemPressed: {
    backgroundColor: Colors.surface,
  },
  itemLabel: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
  },
  itemLabelSelected: {
    fontFamily: Fonts.sansSemiBold,
  },
  itemLabelDisabled: {
    color: Colors.textMuted,
  },
  itemHint: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
