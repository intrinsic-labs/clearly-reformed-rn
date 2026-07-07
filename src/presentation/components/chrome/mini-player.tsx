import TrackPlayer from '@javascriptcommon/react-native-track-player';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PauseIcon, PlayIcon, SkipBackIcon } from '@/presentation/components/icons';
import { formatTime } from '@/presentation/lib/format';
import { useNowPlaying } from '@/presentation/playback/use-now-playing';
import { usePlayer } from '@/presentation/playback/use-player';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

/**
 * Persistent mini-player above the tab bar — live playback state, tap to expand
 * into the Now Playing screen. Renders nothing until a session exists (first play
 * or a restored one from the last launch). Full-bleed width with rounded top
 * corners, sitting flush on the tab bar.
 */
export function MiniPlayer() {
  const router = useRouter();
  const { playable, playing, position, duration } = useNowPlaying();
  const { toggle } = usePlayer();

  if (!playable) return null;

  const fraction = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <Pressable style={styles.container} onPress={() => router.push('/player')} accessibilityRole="button" accessibilityLabel="Open the player">
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${fraction * 100}%` }]} />
      </View>

      <View style={styles.row}>
        {playable.artworkUrl ? (
          <Image source={{ uri: playable.artworkUrl }} style={styles.artwork} contentFit="cover" />
        ) : (
          <View style={styles.artwork} />
        )}

        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {playable.resource.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatTime(position)} · {playable.album}
          </Text>
        </View>

        <View style={styles.controls}>
          <Pressable hitSlop={8} style={styles.skip} onPress={() => TrackPlayer.seekBy(-15)}>
            <SkipBackIcon size={20} color="#D8DAD0" />
          </Pressable>
          <Pressable hitSlop={8} style={styles.playButton} onPress={toggle}>
            {playing ? <PauseIcon size={14} color={Colors.green} /> : <PlayIcon size={14} color={Colors.green} />}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.green,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: 9,
    paddingBottom: 10,
    paddingHorizontal: Spacing.md,
    overflow: 'hidden',
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
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(241,235,221,0.14)',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: 13.5,
    color: Colors.onGreen,
  },
  meta: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.onGreenMuted,
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
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
