import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NotebookFilter } from '@/application/ports/notebook-repository';
import type { NotebookEntry } from '@/domain/notebook';
import { CloseIcon, PencilIcon, PlusIcon, SearchIcon } from '@/presentation/components/icons';
import { ClipCard } from '@/presentation/components/notebook/clip-card';
import { HighlightCard } from '@/presentation/components/notebook/highlight-card';
import { NoteCard } from '@/presentation/components/notebook/note-card';
import {
  useNotebook,
  useNotebookCounts,
  useNotebookMutations,
  useNotebookSearch,
} from '@/presentation/hooks/queries/use-notebook';
import { useOpenResource } from '@/presentation/hooks/use-open-resource';
import { usePlayClip } from '@/presentation/playback/use-play-clip';
import { Colors, Fonts, Spacing, Type } from '@/presentation/theme';

const FILTERS: readonly { key: NotebookFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'highlights', label: 'Highlights' },
  { key: 'clips', label: 'Clips' },
  { key: 'notes', label: 'Notes' },
];

/**
 * The Notebook — the cross-media personal study layer. One feed of highlights,
 * clips, and notes with filter chips, FTS search, tap-through to sources, and a
 * FAB for blank notes. Long-press any card to delete it.
 */
export default function NotebookScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<NotebookFilter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fabOpen, setFabOpen] = useState(false);

  const searching = searchOpen && searchTerm.trim().length >= 2;
  const list = useNotebook(filter);
  const found = useNotebookSearch(searchTerm);
  const counts = useNotebookCounts();
  const { remove } = useNotebookMutations();
  const openResource = useOpenResource();
  const { playClip, pendingId } = usePlayClip();

  const entries = searching ? (found.data ?? []) : (list.data ?? []);

  const confirmDelete = useCallback(
    (entry: NotebookEntry) => {
      Alert.alert(`Delete this ${entry.kind}?`, 'It will be removed from your notebook.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove.mutate({ kind: entry.kind, id: entry.id }) },
      ]);
    },
    [remove],
  );

  const openEditor = useCallback(
    (entry?: NotebookEntry) => {
      if (entry && entry.kind === 'note') {
        router.push({
          pathname: '/note-editor',
          params: { noteId: entry.id, title: entry.title ?? '', body: entry.body, tags: entry.tags.join(', ') },
        });
      } else {
        router.push('/note-editor');
      }
      setFabOpen(false);
    },
    [router],
  );

  const renderEntry = useCallback(
    ({ item }: { item: NotebookEntry }) => {
      const onOpenSource = () => item.resource && openResource(item.resource);
      switch (item.kind) {
        case 'highlight':
          return <HighlightCard entry={item} onOpenSource={onOpenSource} onLongPress={() => confirmDelete(item)} />;
        case 'clip':
          return (
            <ClipCard
              entry={item}
              onPlay={() => {
                if (pendingId) return;
                playClip(item).then((ok) => {
                  if (ok) router.push('/player');
                });
              }}
              onOpenSource={() =>
                item.mediaKind === 'video'
                  ? openResource(item.resource, item.startSec)
                  : onOpenSource()
              }
              onLongPress={() => confirmDelete(item)}
            />
          );
        case 'note':
          return (
            <NoteCard
              entry={item}
              onPress={() => openEditor(item)}
              onOpenSource={onOpenSource}
              onLongPress={() => confirmDelete(item)}
            />
          );
      }
    },
    [openResource, confirmDelete, openEditor, playClip, pendingId, router],
  );

  const countParts = counts.data
    ? ([
        [counts.data.highlights, 'highlights'],
        [counts.data.clips, 'clips'],
        [counts.data.notes, 'notes'],
      ] as const)
    : null;

  const header = (
    <View>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Notebook</Text>
          {countParts ? (
            <Text style={styles.countsLine}>
              {countParts.map(([n, label], index) => (
                <Text key={label}>
                  {index > 0 ? <Text style={styles.countsDot}> · </Text> : null}
                  <Text style={styles.countsNumber}>{n}</Text> {label}
                </Text>
              ))}
            </Text>
          ) : null}
        </View>
        <Pressable
          style={styles.searchButton}
          onPress={() => {
            setSearchOpen((open) => {
              if (open) setSearchTerm('');
              return !open;
            });
          }}
          accessibilityLabel={searchOpen ? 'Close notebook search' : 'Search your notebook'}>
          {searchOpen ? <CloseIcon size={14} color={Colors.inkSoft} /> : <SearchIcon size={18} color={Colors.inkSoft} />}
        </Pressable>
      </View>

      {searchOpen ? (
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search highlights, clips, and notes"
          placeholderTextColor={Colors.textMuted}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />
      ) : (
        <View style={styles.chipsRow}>
          {FILTERS.map(({ key, label }) => {
            const on = filter === key;
            return (
              <Pressable
                key={key}
                style={[styles.chip, on ? styles.chipOn : null]}
                onPress={() => setFilter(key)}
                accessibilityState={{ selected: on }}>
                <Text style={[styles.chipLabel, on ? styles.chipLabelOn : null]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          list.isLoading || (searching && found.isLoading) ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator color={Colors.gold} />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>{searching ? 'Nothing found' : 'Your study layer'}</Text>
              <Text style={styles.emptyNote}>
                {searching
                  ? 'Try a different word or phrase.'
                  : 'Highlight a sentence in an article, clip a moment in a podcast or video, or write a note — everything lands here, searchable and offline.'}
              </Text>
            </View>
          )
        }
      />

      {/* FAB + add menu */}
      {fabOpen ? (
        <Pressable style={styles.fabScrim} onPress={() => setFabOpen(false)}>
          <View style={styles.fabMenu}>
            <Pressable style={styles.fabMenuItem} onPress={() => openEditor()}>
              <Text style={styles.fabMenuLabel}>Blank note</Text>
              <View style={styles.fabMenuIcon}>
                <PencilIcon size={19} color={Colors.inkSoft} />
              </View>
            </Pressable>
          </View>
        </Pressable>
      ) : null}
      <Pressable style={styles.fab} onPress={() => setFabOpen((open) => !open)} accessibilityLabel="Add to your notebook">
        <View style={{ transform: [{ rotate: fabOpen ? '45deg' : '0deg' }] }}>
          <PlusIcon size={24} color="#241F16" />
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={{ height: 14 }} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 120,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  title: {
    ...Type.display,
    fontSize: 30,
    color: Colors.ink,
    marginTop: 6,
  },
  countsLine: {
    ...Type.meta,
    color: Colors.textMuted,
    marginTop: 11,
    letterSpacing: 0.4,
  },
  countsNumber: {
    color: Colors.inkSoft,
    fontFamily: Fonts.sansSemiBold,
  },
  countsDot: {
    color: '#CFC6B2',
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  searchInput: {
    marginTop: 18,
    marginBottom: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.ink,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 9,
    paddingTop: 20,
    paddingBottom: 14,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
  },
  chipOn: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  chipLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.inkSoft,
  },
  chipLabelOn: {
    color: Colors.background,
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
  },
  emptyNote: {
    ...Type.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  fabScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(34,28,19,0.34)',
    zIndex: 5,
  },
  fabMenu: {
    position: 'absolute',
    right: 18,
    bottom: 92,
    alignItems: 'flex-end',
    gap: 11,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  fabMenuLabel: {
    fontFamily: Fonts.serifBold,
    fontSize: 14,
    color: '#F4EFE2',
    backgroundColor: 'rgba(34,28,19,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    overflow: 'hidden',
  },
  fabMenuIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderChrome,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
    shadowColor: '#966C10',
    shadowOpacity: 0.55,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 10 },
  },
});
