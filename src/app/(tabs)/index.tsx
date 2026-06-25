import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/presentation/components/chrome/app-header';
import { Colors, Spacing, Type } from '@/presentation/theme';

/**
 * Home shell — shared app header over a placeholder body. The magazine feed
 * ("Today" hero, Continue, Latest, From your notebook) is the next build slice,
 * backed by kdy/v1/all-resources.
 */
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Clearly Reformed" />

      <View style={styles.body}>
        <Text style={styles.note}>The magazine feed lands here next — for now this confirms the chrome, fonts, and palette.</Text>
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
