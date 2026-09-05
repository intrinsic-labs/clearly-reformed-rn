import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ContinueItem } from '@/domain/progress';
import { resourceKey } from '@/domain/resource-ref';
import { AppHeader } from '@/presentation/components/chrome/app-header';
import { useBottomChromeInset } from '@/presentation/components/chrome/bottom-chrome';
import { FeaturedCard } from '@/presentation/components/content/featured-card';
import { ResourceCard } from '@/presentation/components/content/resource-card';
import { ContinueCard } from '@/presentation/components/home/continue-card';
import { SavedMiniCard } from '@/presentation/components/home/saved-mini-card';
import { SectionHeader } from '@/presentation/components/home/section-header';
import { SeriesRail } from '@/presentation/components/home/series-rail';
import { useDailyPick } from '@/presentation/hooks/queries/use-daily-pick';
import { useNewForYou, useRecommendations } from '@/presentation/hooks/queries/use-home';
import { useContinueList } from '@/presentation/hooks/queries/use-progress';
import { useResourceFeed } from '@/presentation/hooks/queries/use-resource-feed';
import { useSavedList } from '@/presentation/hooks/queries/use-saved';
import { useOpenResource } from '@/presentation/hooks/use-open-resource';
import { usePlayer } from '@/presentation/playback/use-player';
import { Colors, Fonts, Spacing, Type } from '@/presentation/theme';

const RAIL_COUNT = 8;
const EMPTY_KEYS: readonly string[] = [];

/**
 * Home — the personal daily surface, not a copy of the website's front page.
 * It knows what the user has read, saved, and studied, and uses that lightly:
 *
 *   Featured (today's pick)  →  Continue  →  New for you (unseen latest)
 *   →  Explainer Series  →  Coram Deo  →  Picked for you  →  Recently saved
 *
 * The chronological catalogue lives in the Library tab.
 */
export default function HomeScreen() {
  const router = useRouter();
  const openResource = useOpenResource();
  const { play } = usePlayer();
  const chromeInset = useBottomChromeInset();

  const daily = useDailyPick();
  const dailyKey = daily.data ? resourceKey(daily.data.type, daily.data.id) : null;
  const excludeKeys = useMemo(() => (dailyKey ? [dailyKey] : EMPTY_KEYS), [dailyKey]);

  const continueList = useContinueList(8);
  const newForYou = useNewForYou(excludeKeys);
  const recommendations = useRecommendations(excludeKeys);
  const videos = useResourceFeed('video');
  const conference = useResourceFeed('conference');
  const saved = useSavedList();

  const explainers = (videos.data?.pages[0]?.items ?? []).slice(0, RAIL_COUNT);
  const coramDeo = (conference.data?.pages[0]?.items ?? []).slice(0, RAIL_COUNT);
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Spacing.xxl + chromeInset }]}>
        {/* Featured — today's pick */}
        <View style={styles.featured}>
          <Text style={styles.eyebrow}>Featured</Text>
          {daily.data ? (
            <FeaturedCard resource={daily.data} pill="Today’s Pick" onPress={() => daily.data && openResource(daily.data)} />
          ) : daily.isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={Colors.gold} />
            </View>
          ) : null}
        </View>

        {/* Continue */}
        {(continueList.data?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Continue" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
              {(continueList.data ?? []).map((item) => (
                <ContinueCard key={item.progress.resource.key} item={item} onPress={() => onContinue(item)} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* New for you — the newest things this user hasn't opened */}
        {(newForYou.data?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <View style={styles.titleWithLink}>
              <SectionHeader title="New for you" />
              <Pressable onPress={() => router.navigate('/library')} hitSlop={6} accessibilityRole="link">
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.list}>
              {(newForYou.data ?? []).map((item) => (
                <ResourceCard key={`${item.type}-${item.id}`} resource={item} onPress={() => openResource(item)} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Explainer Series — dark band */}
        <SeriesRail
          title="Explainer Series"
          blurb="Theological truths, five minutes at a time."
          items={explainers}
          kind="video"
          dark
          onPressTitle={() => router.navigate('/library')}
          onPressItem={openResource}
        />

        {/* Coram Deo */}
        <SeriesRail
          title="Coram Deo"
          blurb="Listen in on sermons, discussions, and more."
          items={coramDeo}
          kind="conference"
          onPressTitle={() => router.navigate('/library')}
          onPressItem={openResource}
        />

        {/* Picked for you — light taste-weighted backfill */}
        {(recommendations.data?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Picked for you" blurb="Because of what you’ve saved and studied." />
            <View style={styles.list}>
              {(recommendations.data ?? []).map((item) => (
                <ResourceCard key={`${item.type}-${item.id}`} resource={item} onPress={() => openResource(item)} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Recently saved */}
        {savedItems.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Recently saved" onPress={() => router.navigate('/notebook')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
              {savedItems.map((item) => (
                <SavedMiniCard key={item.resource.key} resource={item.resource} onPress={() => openResource(item.resource)} />
              ))}
            </ScrollView>
          </View>
        ) : null}
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
    paddingTop: Spacing.sm,
  },
  featured: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  eyebrow: {
    ...Type.eyebrow,
    color: Colors.ink,
  },
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  section: {
    paddingTop: Spacing.xxxl,
    gap: Spacing.lg,
  },
  titleWithLink: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingRight: Spacing.xl,
  },
  seeAll: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.gold,
    paddingBottom: 6,
  },
  list: {
    paddingHorizontal: Spacing.xl,
  },
  rail: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
});
