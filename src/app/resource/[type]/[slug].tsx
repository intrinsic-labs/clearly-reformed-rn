import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ContentType } from '@/domain/resource';
import { toResourceRef } from '@/domain/resource-ref';
import { ArticleBody } from '@/presentation/components/reader/article-body';
import { InlineVideo } from '@/presentation/components/reader/inline-video';
import { CONTENT_TYPE_LABEL } from '@/presentation/components/content-icons';
import { BookmarkIcon, ChevronLeftIcon, PlayIcon } from '@/presentation/components/icons';
import { useResourceContent } from '@/presentation/hooks/queries/use-resource-content';
import { useResolvedTrack } from '@/presentation/hooks/queries/use-resolved-track';
import { useIsSaved, useToggleSaved } from '@/presentation/hooks/queries/use-saved';
import { formatTime, shortDate } from '@/presentation/lib/format';
import { htmlToBlocks, readingTimeMinutes } from '@/presentation/lib/html';
import { parseYouTubeId, stripLeadingYouTubeEmbed } from '@/presentation/lib/video';
import { usePlayer } from '@/presentation/playback/use-player';
import { ReaderScreen } from '@/presentation/reader/reader-screen';
import { Colors, Fonts, Reader, Spacing, Type } from '@/presentation/theme';

const KNOWN_TYPES = new Set<ContentType>([
  'article',
  'video',
  'podcast',
  'sermon',
  'sermon-clip',
  'lecture',
  'conference',
  'book',
  'event',
]);

function asContentType(value: string | undefined): ContentType | undefined {
  return value && KNOWN_TYPES.has(value as ContentType) ? (value as ContentType) : undefined;
}

const PLAY_LABEL: Partial<Record<ContentType, string>> = {
  podcast: 'Play episode',
  sermon: 'Play sermon',
  lecture: 'Play lecture',
  book: 'Play audiobook',
  conference: 'Play session',
};

export default function ResourceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type: string; slug: string; title?: string; t?: string; hl?: string }>();

  const type = asContentType(params.type);
  const slug = params.slug;
  const startAtParam = params.t ? Number(params.t) : undefined;
  const startAt = Number.isFinite(startAtParam) ? startAtParam : undefined;

  const { data, isLoading, isError, refetch } = useResourceContent(type, slug);

  const bodyHtml = useMemo(
    () => (data ? stripLeadingYouTubeEmbed(data.bodyHtml, data.videoUrl) : ''),
    [data],
  );
  const blocks = useMemo(() => htmlToBlocks(bodyHtml), [bodyHtml]);
  const minutes = useMemo(() => readingTimeMinutes(blocks), [blocks]);
  const youTubeId = parseYouTubeId(data?.videoUrl);

  const resource = data ? toResourceRef(data) : null;
  const { data: track } = useResolvedTrack(data);
  const { play } = usePlayer();
  const isSaved = useIsSaved(resource?.key).data ?? false;
  const toggleSaved = useToggleSaved();

  const onPlay = async () => {
    if (!track) return;
    await play(track);
    router.push('/player');
  };

  // Lazy state (not a ref) so the interpolation can be read during render.
  const [progress] = useState(() => new Animated.Value(0));
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = contentSize.height - layoutMeasurement.height;
    progress.setValue(max > 0 ? Math.min(1, Math.max(0, contentOffset.y / max)) : 0);
  };

  // Long-form written content gets the immersive Reader; media types keep the
  // detail layout below (hero, play, inline video, show notes).
  if (data && (data.type === 'article' || data.type === 'book') && data.bodyHtml.trim()) {
    return <ReaderScreen detail={data} highlightId={params.hl} />;
  }

  const sectionLabel = type ? `${CONTENT_TYPE_LABEL[type]}s` : 'Reading';
  const byline = data
    ? [data.people[0], shortDate(data.displayDate), `${minutes} min read`].filter(Boolean).join('  ·  ')
    : '';
  // A YouTube video plays inline; a non-YouTube video falls back to opening on the
  // web; a cross-posted article links out to its original source.
  const fallbackVideoUrl = !youTubeId && data?.videoUrl ? data.videoUrl : null;
  const externalUrl = fallbackVideoUrl ?? data?.sourceUrl ?? null;
  const externalLabel = fallbackVideoUrl ? 'Watch on the web' : 'Read at the source';

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.gold} />
          </View>
        ) : isError || !data ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>Couldn’t load this resource.</Text>
            <Pressable style={styles.retry} onPress={() => refetch()}>
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.eyebrow}>{CONTENT_TYPE_LABEL[data.type]}</Text>
            <Text style={styles.title}>{data.title}</Text>
            {byline ? <Text style={styles.byline}>{byline}</Text> : null}
            {data.scriptureRef ? <Text style={styles.scripture}>{data.scriptureRef}</Text> : null}

            {track ? (
              <Pressable style={styles.playPill} onPress={onPlay} accessibilityRole="button">
                <PlayIcon size={13} color={Colors.onGreen} />
                <Text style={styles.playPillLabel}>
                  {PLAY_LABEL[data.type] ?? 'Play audio'}
                  {track.durationSec ? `  ·  ${formatTime(track.durationSec)}` : ''}
                </Text>
              </Pressable>
            ) : null}

            {youTubeId ? (
              <InlineVideo videoId={youTubeId} resource={resource ?? undefined} startAtOverride={startAt} />
            ) : null}

            {externalUrl ? (
              <Pressable style={styles.sourceLink} onPress={() => Linking.openURL(externalUrl)}>
                <Text style={styles.sourceLabel}>{externalLabel} ↗</Text>
              </Pressable>
            ) : null}

            <View style={styles.rule} />

            {blocks.length > 0 ? (
              <ArticleBody blocks={blocks} />
            ) : (
              <Text style={styles.empty}>No reading text for this resource yet.</Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Top bar (its bottom edge doubles as the reading-progress bar) */}
      <View style={[styles.topBar, { paddingTop: insets.top, height: insets.top + 50 }]}>
        <View style={styles.headerTrack}>
          <Animated.View
            style={[
              styles.headerFill,
              { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <ChevronLeftIcon size={22} color={Reader.fg} />
        </Pressable>
        <Text style={styles.barLabel}>{sectionLabel}</Text>
        <Pressable
          style={styles.backButton}
          hitSlop={8}
          disabled={!resource}
          onPress={() => resource && toggleSaved.mutate(resource)}
          accessibilityLabel={isSaved ? 'Remove from saved' : 'Save'}>
          <BookmarkIcon size={19} color={isSaved ? Colors.gold : Reader.fg} filled={isSaved} />
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Reader.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 30,
  },
  center: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  errorText: {
    ...Type.body,
    color: Reader.sub,
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
  eyebrow: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    color: Colors.gold,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: 0.1,
    color: Reader.fg,
    marginTop: 8,
  },
  byline: {
    fontFamily: Fonts.sansMedium,
    fontSize: 11.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Reader.sub,
    marginTop: 16,
  },
  scripture: {
    fontFamily: Fonts.serif,
    fontSize: 15,
    color: Reader.accent,
    marginTop: 8,
  },
  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    alignSelf: 'flex-start',
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: Colors.green,
  },
  playPillLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.onGreen,
  },
  sourceLink: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  sourceLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    color: Colors.goldDeep,
  },
  rule: {
    height: 1,
    backgroundColor: Reader.hair,
    marginTop: 22,
    marginBottom: 24,
  },
  empty: {
    ...Type.body,
    color: Reader.sub,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(244,239,227,0.86)',
  },
  headerTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2.5,
    backgroundColor: Reader.hair,
  },
  headerFill: {
    height: '100%',
    backgroundColor: Colors.goldBright,
  },
  backButton: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: Reader.sub,
  },
});
