import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ContinueItem } from '@/domain/progress';
import { AppHeader } from '@/presentation/components/chrome/app-header';
import { ContinueCard } from '@/presentation/components/home/continue-card';
import { SavedMiniCard } from '@/presentation/components/home/saved-mini-card';
import { TodayCard } from '@/presentation/components/home/today-card';
import { ResourceCard } from '@/presentation/components/content/resource-card';
import { useContinueList } from '@/presentation/hooks/queries/use-progress';
import { useDailyPick } from '@/presentation/hooks/queries/use-daily-pick';
import { useResourceFeed } from '@/presentation/hooks/queries/use-resource-feed';
import { useSavedList } from '@/presentation/hooks/queries/use-saved';
import { useOpenResource } from '@/presentation/hooks/use-open-resource';
import { usePlayer } from '@/presentation/playback/use-player';
import { Colors, Fonts, Spacing, Type } from '@/presentation/theme';

const LATEST_COUNT = 5;

/**
 * Home — the daily surface: date + "Today" hero (deterministic daily pick),
 * cross-content Continue rail, Latest from the unified feed, and recently saved.
 */
export default function HomeScreen() {
  const router = useRouter();
  const openResource = useOpenResource();
  const { play } = usePlayer();

  // Lazy state: today's date is fixed for the mounted session (impure in render).
  const [today] = useState(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  );

  const daily = useDailyPick();
  const continueList = useContinueList(8);
  const feed = useResourceFeed();
  const saved = useSavedList();

  const latest = (feed.data?.pages[0]?.items ?? []).slice(0, LATEST_COUNT);
  const savedItems = (saved.data ?? []).slice(0, 8);

  const onContinue = async (item: ContinueItem) => {
    if (item.progress.kind === 'listen' && item.playable) {
      await play(item.playable);
      router.push('/player');
    } else {
      openResource(item.progress.resource);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Clearly Reformed" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Today */}
        <View style={styles.todaySection}>
          <Text style={styles.dateEyebrow}>{today}</Text>
          <Text style={styles.heroTitle}>For your week ahead</Text>
          {daily.data ? (
            <TodayCard resource={daily.data} onPress={() => daily.data && openResource(daily.data)} />
          ) : daily.isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={Colors.gold} />
            </View>
          ) : null}
        </View>

        {/* Continue */}
        {(continueList.data?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Continue</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
              {(continueList.data ?? []).map((item) => (
                <ContinueCard key={item.progress.resource.key} item={item} onPress={() => onContinue(item)} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Latest */}
        <View style={[styles.section, styles.latestSection]}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 0 }]}>
            <Text style={styles.sectionLabel}>Latest</Text>
            <Pressable onPress={() => router.navigate('/library')} hitSlop={6}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {feed.isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={Colors.gold} />
            </View>
          ) : (
            latest.map((item) => (
              <ResourceCard key={`${item.type}-${item.id}`} resource={item} onPress={() => openResource(item)} />
            ))
          )}
        </View>

        {/* From your notebook */}
        {savedItems.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>From your notebook</Text>
              <Pressable onPress={() => router.navigate('/notebook')} hitSlop={6}>
                <Text style={styles.seeAll}>Open</Text>
              </Pressable>
            </View>
            <Text style={styles.savedSubtitle}>Recently saved</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
              {savedItems.map((item) => (
                <SavedMiniCard
                  key={item.resource.key}
                  resource={item.resource}
                  onPress={() => openResource(item.resource)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.md,
  },
  todaySection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 8,
  },
  dateEyebrow: {
    ...Type.eyebrow,
    color: Colors.goldDeep,
  },
  heroTitle: {
    ...Type.title1,
    color: Colors.ink,
    marginTop: 7,
    marginBottom: 16,
  },
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  section: {
    marginTop: 30,
  },
  latestSection: {
    paddingHorizontal: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 13,
  },
  sectionLabel: {
    ...Type.eyebrow,
    color: Colors.textMuted,
  },
  seeAll: {
    fontFamily: Fonts.sansMedium,
    fontSize: 12,
    color: Colors.goldDeep,
  },
  savedSubtitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 18,
    color: Colors.ink,
    paddingHorizontal: Spacing.xl,
    marginTop: -6,
    marginBottom: 13,
  },
  railContent: {
    paddingHorizontal: Spacing.xl,
    gap: 13,
  },
});
