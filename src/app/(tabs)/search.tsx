import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Resource } from '@/domain/resource';
import { AppHeader } from '@/presentation/components/chrome/app-header';
import { SearchIcon } from '@/presentation/components/icons';
import { ResourceCard } from '@/presentation/components/content/resource-card';
import {
  useDebounced,
  useOfflineSearchResults,
  useSearchResults,
} from '@/presentation/hooks/queries/use-search';
import { useOpenResource } from '@/presentation/hooks/use-open-resource';
import { Colors, Fonts, Spacing, Type } from '@/presentation/theme';

/**
 * Keyword search across the whole corpus (`wp/v2/search`), falling back to the
 * local FTS index over saved content when the network is unavailable. The
 * semantic search (v2 signature feature) will layer on top of this screen.
 */
export default function SearchScreen() {
  const [input, setInput] = useState('');
  const term = useDebounced(input.trim());
  const active = term.length >= 2;

  const remote = useSearchResults(term);
  const offline = useOfflineSearchResults(term, remote.isError);
  const openResource = useOpenResource();

  const results: readonly Resource[] = remote.data ?? offline.data ?? [];
  const searching = active && (remote.isLoading || (remote.isError && offline.isLoading));
  const usingOffline = remote.isError && (offline.data?.length ?? 0) > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Search" showSearch={false} />
      <View style={styles.header}>
        <View style={styles.field}>
          <SearchIcon size={17} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Articles, sermons, episodes, videos…"
            placeholderTextColor={Colors.textMuted}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        {usingOffline ? <Text style={styles.offlineNote}>Offline — showing results from your saved content.</Text> : null}
      </View>

      <FlatList
        data={active ? results : []}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => <ResourceCard resource={item} onPress={() => openResource(item)} />}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searching ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator color={Colors.gold} />
            </View>
          ) : active && remote.isError && (offline.data?.length ?? 0) === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Can’t reach the library</Text>
              <Text style={styles.emptyNote}>Check your connection — saved content stays searchable offline.</Text>
            </View>
          ) : active && !remote.isLoading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Nothing found</Text>
              <Text style={styles.emptyNote}>Try a different word or phrase — titles and full text are searched.</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Search the whole library</Text>
              <Text style={styles.emptyNote}>
                Every article, sermon, episode, video, and book — theology for the everyday, one search away.
              </Text>
            </View>
          )
        }
      />
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
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
    borderRadius: 13,
    paddingHorizontal: 13,
    marginTop: 2,
    marginBottom: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    color: Colors.ink,
  },
  offlineNote: {
    ...Type.meta,
    color: Colors.goldDeep,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  emptyWrap: {
    paddingTop: 70,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    ...Type.title2,
    color: Colors.ink,
    textAlign: 'center',
  },
  emptyNote: {
    ...Type.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
