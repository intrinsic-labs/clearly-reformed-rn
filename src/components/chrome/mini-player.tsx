import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PauseIcon, PlayIcon, SkipBackIcon } from '@/components/icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

/**
 * Persistent mini-player that sits directly above the tab bar as one chrome unit.
 *
 * Slice-1 placeholder: static track + local play/pause toggle, no real audio.
 * The audio slice will feed this from react-native-track-player state and make the
 * whole bar tappable to expand into the Now Playing screen.
 */
export function MiniPlayer() {
  const [playing, setPlaying] = useState(false);
  const progressPct = '38%';

  return (
    <Pressable style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressPct }]} />
      </View>

      <View style={styles.row}>
        <View style={styles.artwork} />

        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            The Most Special Guest Ever
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            22:14 · Life and Books and Everything
          </Text>
        </View>

        <View style={styles.controls}>
          <Pressable hitSlop={8} style={styles.skip}>
            <SkipBackIcon size={20} color="#D8DAD0" />
          </Pressable>
          <Pressable hitSlop={8} style={styles.playButton} onPress={() => setPlaying((p) => !p)}>
            {playing ? <PauseIcon size={14} color={Colors.green} /> : <PlayIcon size={14} color={Colors.green} />}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
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
