import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import YoutubePlayer, { type YoutubeIframeRef } from 'react-native-youtube-iframe';

import type { ResourceRef } from '@/domain/resource-ref';
import { useInvalidateProgress, useResourceProgress } from '@/presentation/hooks/queries/use-progress';
import { useUseCases } from '@/presentation/providers/use-cases-context';
import { Radius, Spacing } from '@/presentation/theme';

/**
 * Inline YouTube player for the reader. Wraps the official IFrame Player API (via
 * react-native-youtube-iframe over a WebView) — the only way to play YouTube-hosted
 * video, since it exposes no direct stream for expo-video.
 *
 * Sizes itself to the available width at a 16:9 ratio (the player needs explicit
 * pixel dimensions). Renders its poster + tap-to-play; it does not autoplay.
 *
 * When a `resource` is provided, watch position persists to the progress store
 * every few seconds while playing (and resumes from it), so videos participate in
 * cross-content "Continue".
 */
export function InlineVideo({ videoId, resource }: { videoId: string; resource?: ResourceRef }) {
  const [width, setWidth] = useState(0);
  const height = Math.round((width * 9) / 16);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next !== width) setWidth(next);
  };

  const playerRef = useRef<YoutubeIframeRef>(null);
  const { progress } = useUseCases();
  const invalidateProgress = useInvalidateProgress();
  const stored = useResourceProgress(resource?.key);
  const startAt =
    stored.data && stored.data.kind === 'watch' && !stored.data.completed
      ? Math.max(0, Math.floor(stored.data.position) - 2)
      : 0;

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const persistPosition = useCallback(async () => {
    const player = playerRef.current;
    if (!player || !resource) return;
    try {
      const [position, duration] = await Promise.all([player.getCurrentTime(), player.getDuration()]);
      if (duration > 0 && position > 0) {
        await progress.save({ resource, kind: 'watch', position, length: duration });
      }
    } catch {
      // The iframe can be mid-teardown; a missed sample is fine.
    }
  }, [resource, progress]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const onChangeState = useCallback(
    (state: string) => {
      if (!resource) return;
      if (state === 'playing') {
        stopPolling();
        pollTimer.current = setInterval(persistPosition, 5000);
      } else if (state === 'paused' || state === 'ended') {
        stopPolling();
        persistPosition().then(invalidateProgress);
      }
    },
    [resource, persistPosition, stopPolling, invalidateProgress],
  );

  // Wait for the stored position before mounting the iframe, so `start` applies.
  const ready = !resource || !stored.isLoading;

  return (
    <View style={styles.frame} onLayout={onLayout}>
      {width > 0 && ready ? (
        <YoutubePlayer
          ref={playerRef}
          videoId={videoId}
          width={width}
          height={height}
          initialPlayerParams={{ modestbranding: true, rel: false, start: startAt || undefined }}
          webViewProps={{ allowsInlineMediaPlayback: true }}
          onChangeState={onChangeState}
        />
      ) : (
        <View style={{ height: Math.round((320 * 9) / 16) }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    marginTop: Spacing.xl,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});
