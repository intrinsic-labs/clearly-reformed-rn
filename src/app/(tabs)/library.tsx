import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { FeedOrder } from '@/application/ports/resource-repository';
import type { Resource } from '@/domain/resource';
import { AppHeader } from '@/presentation/components/chrome/app-header';
import { useBottomChromeInset } from '@/presentation/components/chrome/bottom-chrome';
import { FeaturedCard } from '@/presentation/components/content/featured-card';
import {
  type ContentFilter,
  TYPE_OPTIONS,
  labelFor,
  sortOptions,
} from '@/presentation/components/content/library-filters';
import { ResourceCard } from '@/presentation/components/content/resource-card';
import { DropdownMenu } from '@/presentation/components/menu/dropdown-menu';
import { useResourceFeed } from '@/presentation/hooks/queries/use-resource-feed';
import { useOpenResource } from '@/presentation/hooks/use-open-resource';
import { Colors, Spacing, Type } from '@/presentation/theme';

/**
 * Library — the catalogue. A Featured hero (the newest piece) sits above the full
 * list, which is filtered by a type menu and sorted by a sort menu (the Figma's
 * "Sort ⌄ / All Resources ⌄" pills). Latest-first is the list itself, so there is
 * no separate "Latest" section here.
 */
export default function LibraryScreen() {
  const [filter, setFilter] = useState<ContentFilter>('all');
  const [order, setOrder] = useState<FeedOrder>('newest');
  const isAll = filter === 'all';
  const openResource = useOpenResource();
  const chromeInset = useBottomChromeInset();

  const onFilterChange = useCallback((next: ContentFilter) => {
    setFilter(next);
    // The unified feed can't be reversed; fall back to newest when leaving a type.
    if (next === 'all') setOrder('newest');
  }, []);

  // Each filter reads its own paginated endpoint, so the infinite scroll knows its end.
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useResourceFeed(isAll ? undefined : filter, order);

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  // On the unified, newest-first feed, lift the newest item into the Featured hero.
  const featured = isAll && order === 'newest' && items.length > 0 ? items[0] : null;
  const listItems = featured ? items.slice(1) : items;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const keyExtractor = useCallback((item: Resource) => `${item.type}-${item.id}`, []);
  const renderItem = useCallback(
    ({ item }: { item: Resource }) => <ResourceCard resource={item} onPress={() => openResource(item)} />,
    [openResource],
  );

  const header = (
    <View>
      {featured ? (
        <View style={styles.featuredSection}>
          <Text style={styles.eyebrow}>Featured</Text>
          <FeaturedCard resource={featured} onPress={() => openResource(featured)} />
        </View>
      ) : null}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Library</Text>
        <View style={styles.menus}>
          <DropdownMenu label="Sort" value={order} options={sortOptions(filter)} onChange={setOrder} />
          <DropdownMenu
            label={labelFor(TYPE_OPTIONS, filter)}
            value={filter}
            options={TYPE_OPTIONS}
            onChange={onFilterChange}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Library" />

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
          contentContainerStyle={[styles.listContent, { paddingBottom: Spacing.xxl + chromeInset }]}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<Text style={styles.emptyText}>Nothing here yet.</Text>}
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
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  featuredSection: {
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  eyebrow: {
    ...Type.eyebrow,
    color: Colors.ink,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.xxxl,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Type.display,
    color: Colors.ink,
    flexShrink: 1,
  },
  menus: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexShrink: 0,
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
  emptyText: {
    ...Type.body,
    color: Colors.textMuted,
    paddingVertical: Spacing.xxl,
  },
  retry: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    backgroundColor: Colors.ink,
  },
  retryLabel: {
    ...Type.label,
    color: Colors.white,
  },
  footer: {
    paddingVertical: Spacing.xxl,
  },
});
