import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchIcon } from '@/components/icons';
import { Colors, Fonts, Radius, Spacing, Type } from '@/constants/theme';

/**
 * Home shell — app bar (logo slot + wordmark + search) over a placeholder body.
 * The magazine feed ("Today" hero, Continue, Latest, From your notebook) is the
 * next build slice, backed by kdy/v1/all-resources.
 */
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <View style={styles.brand}>
          {/* Gold logo slot — placeholder until the Clearly Reformed gold mark is supplied. */}
          <View style={styles.logo} />
          <Text style={styles.wordmark}>Clearly Reformed</Text>
        </View>
        <View style={styles.searchButton}>
          <SearchIcon size={18} color={Colors.inkSoft} weight={1.8} />
        </View>
      </View>

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
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.xl,
    paddingTop: 6,
    paddingBottom: Spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    borderWidth: 1.6,
    borderColor: Colors.gold,
  },
  wordmark: {
    fontFamily: Fonts.serifBold,
    fontSize: 17,
    color: Colors.ink,
    letterSpacing: 0.1,
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
