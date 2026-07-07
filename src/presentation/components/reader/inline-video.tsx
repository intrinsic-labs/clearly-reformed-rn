import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import { Radius, Spacing } from '@/presentation/theme';

/**
 * Inline YouTube player for the reader. Wraps the official IFrame Player API (via
 * react-native-youtube-iframe over a WebView) — the only way to play YouTube-hosted
 * video, since it exposes no direct stream for expo-video.
 *
 * Sizes itself to the available width at a 16:9 ratio (the player needs explicit
 * pixel dimensions). Renders its poster + tap-to-play; it does not autoplay.
 */
export function InlineVideo({ videoId }: { videoId: string }) {
  const [width, setWidth] = useState(0);
  const height = Math.round((width * 9) / 16);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next !== width) setWidth(next);
  };

  return (
    <View style={styles.frame} onLayout={onLayout}>
      {width > 0 ? (
        <YoutubePlayer
          videoId={videoId}
          width={width}
          height={height}
          initialPlayerParams={{ modestbranding: true, rel: false }}
          webViewProps={{ allowsInlineMediaPlayback: true }}
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
