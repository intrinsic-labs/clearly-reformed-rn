import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Resource } from '@/domain/resource';
import { AppHeader } from '@/presentation/components/chrome/app-header';
import { FeaturedCard } from '@/presentation/components/content/featured-card';
import { type ContentFilter, FilterChips } from '@/presentation/components/content/filter-chips';
import { ResourceCard } from '@/presentation/components/content/resource-card';
import { CONTENT_TYPE_LABEL } from '@/presentation/components/content-icons';
import { useResourceFeed } from '@/presentation/hooks/queries/use-resource-feed';
import { Colors, Spacing, Type } from '@/presentation/theme';

/** Client-side filtering: keep paging until a filter shows a few matches, but cap the
 * auto-paging so a sparse type can't quietly pull the whole feed. */
const MIN_FILTERED = 8;
const MAX_AUTO_PAGES = 12;

export default function LibraryScreen() {
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useResourceFeed();
  const [filter, setFilter] = useState<ContentFilter>('all');

  const allItems = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const filtered = useMemo(
    () => (filter === 'all' ? allItems : allItems.filter((item) => item.type === filter)),
    [allItems, filter],
  );

  const showFeatured = filter === 'all' && filtered.length > 0;
  const featured = showFeatured ? filtered[0] : null;
  const listItems = showFeatured ? filtered.slice(1) : filtered;
  const totalItems = data?.pages[0]?.totalItems ?? 0;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // When a filter is active, the loaded window may hold few matches — keep paging,
  // but stop after MAX_AUTO_PAGES so a sparse type doesn't silently load everything.
  const pagesLoaded = data?.pages.length ?? 0;
  useEffect(() => {
    if (filter !== 'all' && filtered.length < MIN_FILTERED && pagesLoaded < MAX_AUTO_PAGES) loadMore();
  }, [filter, filtered.length, pagesLoaded, loadMore]);

  const sectionTitle = filter === 'all' ? 'All Resources' : `${CONTENT_TYPE_LABEL[filter]}s`;

  const keyExtractor = useCallback((item: Resource) => `${item.type}-${item.id}`, []);
  const renderItem = useCallback(({ item }: { item: Resource }) => <ResourceCard resource={item} />, []);

  const header = (
    <View>
      {featured ? (
        <View style={styles.featuredSection}>
          <Text style={styles.eyebrow}>Featured</Text>
          <FeaturedCard resource={featured} />
        </View>
      ) : null}
      <View style={styles.sectionHeader}>
        <Text style={styles.eyebrow}>{sectionTitle}</Text>
        <Text style={styles.sortLabel}>
          {filter === 'all' ? `${totalItems} · ` : ''}
          <Text style={styles.sortAccent}>Newest</Text>
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Library" />
      <View style={styles.chips}>
        <FilterChips value={filter} onChange={setFilter} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Couldn’t load the library.</Text>
          <Pressable style={styles.retry} onPress={() => refetch()}>
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={header}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color={Colors.gold} style={styles.footer} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chips: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 180,
  },
  featuredSection: {
    paddingTop: Spacing.xs,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: Spacing.xxl,
    paddingBottom: Spacing.xs,
  },
  eyebrow: {
    ...Type.eyebrow,
    color: Colors.textMuted,
  },
  sortLabel: {
    ...Type.meta,
    color: Colors.textMuted,
  },
  sortAccent: {
    color: Colors.goldDeep,
    fontFamily: Type.label.fontFamily,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  errorText: {
    ...Type.body,
    color: Colors.textMuted,
  },
  retry: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    backgroundColor: Colors.green,
  },
  retryLabel: {
    ...Type.label,
    color: Colors.onGreen,
  },
  footer: {
    paddingVertical: Spacing.xxl,
  },
});
