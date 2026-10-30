import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Colors, Fonts } from '@/presentation/theme';

/**
 * Standard swipe-left-to-delete for notebook cards (long-press was undiscoverable).
 * The destructive action is confirmed with the native platform alert.
 *
 * Child Pressables (card taps) must not fire when the row is swiped open or while
 * a swipe is in progress — RNGH's pan and RN Pressable otherwise both win, so a
 * swipe-to-reveal also navigates into the item. Tap while open closes the row.
 */
export function SwipeToDelete({
  children,
  onDelete,
  label = 'Delete',
  confirmationMessage = 'This will delete this item from your notebook.',
}: {
  children: ReactNode;
  onDelete: () => void;
  label?: string;
  confirmationMessage?: string;
}) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  // Locked while swiping or open so the finger-up that finishes a swipe (and taps
  // meant to dismiss the open row) never reach the card's onPress.
  const lockedRef = useRef(false);

  const lock = () => {
    lockedRef.current = true;
  };
  const unlockSoon = () => {
    // Defer so the same touch's finger-up cannot press the child.
    requestAnimationFrame(() => {
      lockedRef.current = false;
    });
  };

  const confirmDelete = () => {
    Alert.alert(
      'Are you sure?',
      confirmationMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: label, style: 'destructive', onPress: onDelete },
      ],
      { cancelable: true },
    );
  };

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={36}
      overshootRight={false}
      onSwipeableOpenStartDrag={lock}
      onSwipeableCloseStartDrag={lock}
      onSwipeableWillOpen={lock}
      onSwipeableOpen={lock}
      onSwipeableClose={unlockSoon}
      renderRightActions={(_progress, _translation, swipeableMethods) => (
        <Pressable
          style={styles.action}
          onPress={() => {
            swipeableMethods.close();
            confirmDelete();
          }}
          accessibilityLabel={label}
          accessibilityRole="button"
          testID="notebook-swipe-delete">
          <Feather name="trash-2" size={19} color={Colors.white} />
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      )}>
      <View
        onStartShouldSetResponderCapture={() => {
          if (!lockedRef.current) return false;
          swipeableRef.current?.close();
          return true;
        }}
        onMoveShouldSetResponderCapture={() => lockedRef.current}>
        {children}
      </View>
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
