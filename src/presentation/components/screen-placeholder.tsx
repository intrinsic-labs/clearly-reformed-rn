import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/presentation/components/chrome/app-header';
import { Colors, Spacing, Type } from '@/presentation/theme';

/**
 * Slice-1 placeholder for tab screens whose real content lands in later build slices
 * (Library feed, Reader/detail, Notebook, semantic search). Uses the shared app
 * header (gold mark + tab name) so every tab shares the same chrome.
 */
export function ScreenPlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title={title} />
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
