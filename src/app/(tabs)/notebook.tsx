import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NotebookFilter } from '@/application/ports/notebook-repository';
import type { SavedItem } from '@/application/ports/saved-repository';
import type { NotebookEntry } from '@/domain/notebook';
import { AppHeader } from '@/presentation/components/chrome/app-header';
import { CloseIcon, PencilIcon, PlusIcon, SearchIcon, ShareIcon } from '@/presentation/components/icons';
import { ClipCard } from '@/presentation/components/notebook/clip-card';
import { HighlightCard } from '@/presentation/components/notebook/highlight-card';
import { NoteCard } from '@/presentation/components/notebook/note-card';
import { SavedCard } from '@/presentation/components/notebook/saved-card';
import { SwipeToDelete } from '@/presentation/components/notebook/swipe-to-delete';
import {
  useNotebook,
  useNotebookCounts,
  useNotebookMutations,
  useNotebookSearch,
} from '@/presentation/hooks/queries/use-notebook';
import { useSavedList, useToggleSaved } from '@/presentation/hooks/queries/use-saved';
import { useOpenResource } from '@/presentation/hooks/use-open-resource';
import { buildNotebookMarkdown } from '@/presentation/lib/notebook-export';
import { usePlayClip } from '@/presentation/playback/use-play-clip';
import { useUseCases } from '@/presentation/providers/use-cases-context';
import { Colors, Fonts, Spacing, Type } from '@/presentation/theme';

/** The notebook's chips: the three study kinds plus bookmarked content. */
type FeedFilter = NotebookFilter | 'saved';

const FILTERS: readonly { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'highlights', label: 'Highlights' },
  { key: 'clips', label: 'Clips' },
  { key: 'notes', label: 'Notes' },
  { key: 'saved', label: 'Saved' },
];

type FeedItem = NotebookEntry | { readonly kind: 'saved'; readonly saved: SavedItem };

function feedTime(item: FeedItem): number {
  return item.kind === 'saved' ? item.saved.savedAt : item.createdAt;
}

/**
 * The Notebook — the cross-media personal study layer. One feed of highlights,
 * clips, and notes with filter chips, FTS search, tap-through to sources, and a
 * FAB for blank notes. Long-press any card to delete it.
 */
export default function NotebookScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fabOpen, setFabOpen] = useState(false);

  const searching = searchOpen && searchTerm.trim().length >= 2;
  const list = useNotebook(filter === 'saved' ? 'all' : filter);
  const savedList = useSavedList();
  const toggleSaved = useToggleSaved();
  const found = useNotebookSearch(searchTerm);
  const counts = useNotebookCounts();
  const { remove } = useNotebookMutations();
  const openResource = useOpenResource();
  const { playClip, pendingId } = usePlayClip();
  const { notebook: notebookUseCases, saved: savedUseCases } = useUseCases();

  const onExport = useCallback(async () => {
    setFabOpen(false);
    const [allEntries, allSaved] = await Promise.all([notebookUseCases.list('all'), savedUseCases.list()]);
    if (allEntries.length === 0 && allSaved.length === 0) return;
    Share.share({ message: buildNotebookMarkdown(allEntries, allSaved) }).catch(() => {});
  }, [notebookUseCases, savedUseCases]);

  const savedAsFeed: readonly FeedItem[] = (savedList.data ?? []).map((saved) => ({ kind: 'saved' as const, saved }));
  const entries: readonly FeedItem[] = searching
    ? (found.data ?? [])
    : filter === 'saved'
      ? savedAsFeed
      : filter === 'all'
        ? [...(list.data ?? []), ...savedAsFeed].sort((a, b) => feedTime(b) - feedTime(a))
        : (list.data ?? []);

  const deleteEntry = useCallback(
    (entry: NotebookEntry) => remove.mutate({ kind: entry.kind, id: entry.id }),
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
    ({ item }: { item: FeedItem }) => {
      if (item.kind === 'saved') {
        return (
          <SwipeToDelete label="Remove" onDelete={() => toggleSaved.mutate(item.saved.resource)}>
            <SavedCard item={item.saved} onOpen={() => openResource(item.saved.resource)} />
          </SwipeToDelete>
        );
      }
      const onOpenSource = () => item.resource && openResource(item.resource);
      const card = (() => {
        switch (item.kind) {
          case 'highlight':
            return (
              <HighlightCard entry={item} onOpenSource={() => openResource(item.resource, { highlightId: item.id })} />
            );
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
                    ? openResource(item.resource, { startAtSec: item.startSec })
                    : onOpenSource()
                }
              />
            );
          case 'note':
            return <NoteCard entry={item} onPress={() => openEditor(item)} onOpenSource={onOpenSource} />;
        }
      })();
      return <SwipeToDelete onDelete={() => deleteEntry(item)}>{card}</SwipeToDelete>;
    },
    [openResource, deleteEntry, toggleSaved, openEditor, playClip, pendingId, router],
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
      <View style={styles.countsRow}>
        {countParts ? (
          <Text style={styles.countsLine}>
            {countParts.map(([n, label], index) => (
              <Text key={label}>
                {index > 0 ? <Text style={styles.countsDot}> · </Text> : null}
                <Text style={styles.countsNumber}>{n}</Text> {label}
              </Text>
            ))}
          </Text>
        ) : (
          <View />
        )}
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
      <AppHeader title="Notebook" showSearch={false} />
      <FlatList
        data={entries}
        keyExtractor={(item) => (item.kind === 'saved' ? `saved-${item.saved.resource.key}` : item.id)}
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
              <Text style={styles.emptyTitle}>
                {searching ? 'Nothing found' : filter === 'saved' ? 'Nothing saved yet' : 'Your study layer'}
              </Text>
              <Text style={styles.emptyNote}>
                {searching
                  ? 'Try a different word or phrase.'
                  : filter === 'saved'
                    ? 'Tap the bookmark on any article, episode, or video and it will land here.'
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
            <Pressable style={styles.fabMenuItem} onPress={onExport}>
              <Text style={styles.fabMenuLabel}>Export notebook</Text>
              <View style={styles.fabMenuIcon}>
                <ShareIcon size={18} color={Colors.inkSoft} />
              </View>
            </Pressable>
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
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  countsLine: {
    ...Type.meta,
    color: Colors.textMuted,
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
    color: Colors.onGreen,
    backgroundColor: Colors.green,
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
    shadowColor: '#14120C',
    shadowOpacity: 0.28,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
  },
});
