import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing, Type } from '@/constants/theme';

/**
 * Slice-1 placeholder for tab screens whose real content lands in later build slices
 * (Library feed, Reader/detail, Notebook, semantic search). Establishes the title
 * treatment and confirms the chrome/safe-area wiring.
 */
export function ScreenPlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.note}>{note}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Type.display,
    color: Colors.ink,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  note: {
    ...Type.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
