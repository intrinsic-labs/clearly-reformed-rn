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
import { ArticleBody } from '@/presentation/components/reader/article-body';
import { InlineVideo } from '@/presentation/components/reader/inline-video';
import { CONTENT_TYPE_LABEL } from '@/presentation/components/content-icons';
import { ChevronLeftIcon } from '@/presentation/components/icons';
import { useResourceContent } from '@/presentation/hooks/queries/use-resource-content';
import { shortDate } from '@/presentation/lib/format';
import { htmlToBlocks, readingTimeMinutes } from '@/presentation/lib/html';
import { parseYouTubeId } from '@/presentation/lib/video';
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

export default function ResourceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type: string; slug: string; title?: string }>();

  const type = asContentType(params.type);
  const slug = params.slug;

  const { data, isLoading, isError, refetch } = useResourceContent(type, slug);

  const blocks = useMemo(() => (data ? htmlToBlocks(data.bodyHtml) : []), [data]);
  const minutes = useMemo(() => readingTimeMinutes(blocks), [blocks]);

  // Lazy state (not a ref) so the interpolation can be read during render.
  const [progress] = useState(() => new Animated.Value(0));
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = contentSize.height - layoutMeasurement.height;
    progress.setValue(max > 0 ? Math.min(1, Math.max(0, contentOffset.y / max)) : 0);
  };

  const sectionLabel = type ? `${CONTENT_TYPE_LABEL[type]}s` : 'Reading';
  const byline = data
    ? [data.people[0], shortDate(data.displayDate), `${minutes} min read`].filter(Boolean).join('  ·  ')
    : '';
  const youTubeId = parseYouTubeId(data?.videoUrl);
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

            {youTubeId ? <InlineVideo videoId={youTubeId} /> : null}

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

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top, height: insets.top + 50 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <ChevronLeftIcon size={22} color={Reader.fg} />
        </Pressable>
        <Text style={styles.barLabel}>{sectionLabel}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Scroll progress */}
      <View style={[styles.progressTrack, { bottom: insets.bottom + 6 }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
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
    borderBottomWidth: 1,
    borderBottomColor: Reader.hair,
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
  progressTrack: {
    position: 'absolute',
    left: 22,
    right: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: Reader.hair,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.goldBright,
  },
});
