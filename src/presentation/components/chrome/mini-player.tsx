import TrackPlayer from '@javascriptcommon/react-native-track-player';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PauseIcon, PlayIcon, SkipBackIcon } from '@/presentation/components/icons';
import { formatTime } from '@/presentation/lib/format';
import { useNowPlaying } from '@/presentation/playback/use-now-playing';
import { usePlayer } from '@/presentation/playback/use-player';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

export type MiniPlayerVariant =
  /** Inside the iOS 26 tab-bar accessory capsule (system supplies the glass). */
  | 'accessory'
  /** Same, but the tab bar is minimised and the capsule is narrow. */
  | 'accessory-inline'
  /** A self-contained floating pill above a regular tab bar (Android, iOS < 26). */
  | 'floating';

/**
 * Persistent mini-player — live playback state, tap to expand into Now Playing.
 * Renders nothing until a session exists (first play, or one restored from the
 * last launch). The host decides where it lives; see `BottomChrome`.
 */
export function MiniPlayer({ variant }: { variant: MiniPlayerVariant }) {
  const router = useRouter();
  const { playable, playing, position, duration } = useNowPlaying();
  const { toggle } = usePlayer();

  if (!playable) return null;

  const fraction = duration > 0 ? Math.min(1, position / duration) : 0;
  const floating = variant === 'floating';
  const inline = variant === 'accessory-inline';
  const ink = floating ? Colors.onGreen : Colors.ink;
  const inkMuted = floating ? Colors.onGreenMuted : Colors.textMuted;

  return (
    <Pressable
      style={[styles.container, floating ? styles.floating : styles.accessory, inline ? styles.inline : null]}
      onPress={() => router.push('/player')}
      testID="shell-mini-player"
      accessibilityRole="button"
      accessibilityLabel="Open the player">
      {floating ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${fraction * 100}%` }]} />
        </View>
      ) : null}

      <View style={styles.row}>
        {!inline ? (
          playable.artworkUrl ? (
            <Image source={{ uri: playable.artworkUrl }} style={styles.artwork} contentFit="cover" />
          ) : (
            <View style={[styles.artwork, styles.artworkFallback]} />
          )
        ) : null}

        <View style={styles.text}>
          <Text style={[styles.title, { color: ink }]} numberOfLines={1}>
            {playable.resource.title}
          </Text>
          {!inline ? (
            <Text style={[styles.meta, { color: inkMuted }]} numberOfLines={1}>
              {formatTime(position)} · {playable.album}
            </Text>
          ) : null}
        </View>

        <View style={styles.controls}>
          {!inline ? (
            <Pressable hitSlop={8} style={styles.skip} onPress={() => TrackPlayer.seekBy(-15)} testID="shell-mini-player-skip-back">
              <SkipBackIcon size={20} color={ink} />
            </Pressable>
          ) : null}
          <Pressable hitSlop={8} style={[styles.playButton, floating ? styles.playButtonOnGreen : null]} onPress={toggle} testID="shell-mini-player-toggle">
            {playing ? <PauseIcon size={14} color={floating ? Colors.green : Colors.white} /> : <PlayIcon size={14} color={floating ? Colors.green : Colors.white} />}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
  accessory: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  inline: {
    paddingHorizontal: Spacing.sm,
  },
  floating: {
    backgroundColor: Colors.green,
    borderRadius: Radius.xl,
    paddingTop: 9,
    paddingBottom: 10,
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(241,235,221,0.16)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.goldBright,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  artwork: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
  },
  artworkFallback: {
    backgroundColor: 'rgba(120,120,120,0.18)',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 14.5,
  },
  meta: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  skip: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonOnGreen: {
    backgroundColor: Colors.goldBright,
  },
});
