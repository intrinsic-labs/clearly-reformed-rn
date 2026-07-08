import { Feather } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Colors, Fonts } from '@/presentation/theme';

/**
 * Standard swipe-left-to-delete for notebook cards (long-press was undiscoverable).
 * The destructive action is confirmed with the native platform alert.
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
      friction={2}
      rightThreshold={36}
      overshootRight={false}
      renderRightActions={(_progress, _translation, swipeableMethods) => (
        <Pressable
          style={styles.action}
          onPress={() => {
            swipeableMethods.close();
            confirmDelete();
          }}
          accessibilityLabel={label}
          accessibilityRole="button">
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
