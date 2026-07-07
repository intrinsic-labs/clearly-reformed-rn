import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Colors, Fonts } from '@/presentation/theme';

/**
 * Standard swipe-left-to-delete for notebook cards (long-press was undiscoverable).
 * The revealed action deletes immediately — the swipe itself is the confirmation.
 */
export function SwipeToDelete({
  children,
  onDelete,
  label = 'Delete',
}: {
  children: ReactNode;
  onDelete: () => void;
  label?: string;
}) {
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={36}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable style={styles.action} onPress={onDelete} accessibilityLabel={label} accessibilityRole="button">
          <Feather name="trash-2" size={19} color={Colors.white} />
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      )}>
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: 84,
    marginLeft: 12,
    borderRadius: 18,
    backgroundColor: '#A03D2E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: Colors.white,
  },
});
