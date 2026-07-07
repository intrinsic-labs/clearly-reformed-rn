import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/presentation/theme';

/**
 * Shared frame for notebook cards: kicker row (glyph + uppercase label + relative
 * time) over the card body. Notes use the warm tinted variant per the mockup.
 */
export function NotebookCardShell({
  icon,
  label,
  when,
  tinted = false,
  onPress,
  onLongPress,
  children,
}: {
  icon: ReactNode;
  label: string;
  when: string;
  tinted?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      style={[styles.card, tinted ? styles.cardTinted : null]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}>
      <View style={styles.kickerRow}>
        {icon}
        <Text style={[styles.kicker, tinted ? styles.kickerTinted : null]}>{label}</Text>
        <View style={styles.spacer} />
        <Text style={[styles.when, tinted ? styles.whenTinted : null]}>{when}</Text>
      </View>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingHorizontal: 17,
    paddingTop: 16,
    paddingBottom: 15,
    shadowColor: '#2E3A33',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  cardTinted: {
    backgroundColor: '#FBF6EA',
    borderColor: '#EADFC6',
    shadowColor: '#78601E',
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  kicker: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.goldDeep,
  },
  kickerTinted: {
    color: '#8A6A12',
  },
  spacer: {
    flex: 1,
  },
  when: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: '#A89E8A',
  },
  whenTinted: {
    color: '#B0A079',
  },
  // Shared by the card bodies:
  divider: {
    height: 1,
    backgroundColor: Colors.borderSoft,
    marginTop: 14,
    marginBottom: 12,
  },
});

export const cardShellStyles = styles;

/** Spacing token the cards share for their feed gap. */
export const NOTEBOOK_CARD_GAP = Spacing.lg - 2;
