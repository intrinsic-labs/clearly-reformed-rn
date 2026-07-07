import TrackPlayer from '@javascriptcommon/react-native-track-player';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ChevronDownIcon,
  DownloadIcon,
  HeartIcon,
  MoonIcon,
  NotebookIcon,
  PauseIcon,
  PlayIcon,
  ShareIcon,
  SkipBackIcon,
  SkipForwardIcon,
  TranscriptIcon,
} from '@/presentation/components/icons';
import { CONTENT_TYPE_LABEL } from '@/presentation/components/content-icons';
import { useDownload, useDownloadMutations } from '@/presentation/hooks/queries/use-downloads';
import { useNotebook, useNotebookMutations } from '@/presentation/hooks/queries/use-notebook';
import { useIsSaved, useToggleSaved } from '@/presentation/hooks/queries/use-saved';
import { formatRate, formatTime } from '@/presentation/lib/format';
import { cyclePlaybackRate, PLAYBACK_RATES } from '@/presentation/playback/player';
import { cycleSleepTimer, useSleepTimerMinutesLeft } from '@/presentation/playback/sleep-timer';
import { useNowPlaying } from '@/presentation/playback/use-now-playing';
import { usePlayer } from '@/presentation/playback/use-player';
import { Colors, Fonts, Radius, Spacing } from '@/presentation/theme';

/** Player surface palette (dark sage, from the Now Playing mockup). */
const P = {
  fg: '#F4EFE2',
  sub: '#9BA699',
  icon: '#D8DAD0',
  muted: '#C7CEC2',
  headerSub: '#8E9A8C',
  chip: 'rgba(241,235,221,0.08)',
  track: 'rgba(241,235,221,0.16)',
  panel: 'rgba(241,235,221,0.06)',
  panelBorder: 'rgba(241,235,221,0.10)',
} as const;

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { playable, playing, position, duration } = useNowPlaying();
  const { toggle } = usePlayer();

  const [rate, setRate] = useState<number>(PLAYBACK_RATES[0]);
  useEffect(() => {
    TrackPlayer.getRate().then(setRate).catch(() => {});
  }, []);

  const sleepMinutesLeft = useSleepTimerMinutesLeft();

  const isSaved = useIsSaved(playable?.resource.key).data ?? false;
  const toggleSaved = useToggleSaved();
  const download = useDownload(playable?.resource.key);
  const { start: startDownload, remove: removeDownload, progress: downloadProgress } = useDownloadMutations();
  const { addClip } = useNotebookMutations();
  const [clippedAt, setClippedAt] = useState<number | null>(null);
  const clipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (clipTimer.current) clearTimeout(clipTimer.current);
  }, []);

  // Moments you've clipped in this episode, as subtle dots on the seek bar.
  const clips = useNotebook('clips');
  const clipMarkers = useMemo(() => {
    if (!playable || duration <= 0) return [];
    return (clips.data ?? [])
      .filter((entry) => entry.kind === 'clip' && entry.resource.key === playable.resource.key)
      .map((entry) => Math.min(1, Math.max(0, (entry.kind === 'clip' ? entry.startSec : 0) / duration)));
  }, [clips.data, playable, duration]);

  // The player hooks resolve asynchronously, so `playable` is briefly null on every
  // open — only close if there's genuinely no session after a grace period.
  useEffect(() => {
    if (playable) return;
    const timer = setTimeout(() => router.back(), 1200);
    return () => clearTimeout(timer);
  }, [playable, router]);

  if (!playable) {
    return (
      <View style={styles.screen}>
        <LinearGradient colors={['#2A352E', '#202821', '#1A211C']} locations={[0, 0.46, 1]} style={StyleSheet.absoluteFill} />
      </View>
    );
  }

  const eyebrow = playable.eyebrow ?? CONTENT_TYPE_LABEL[playable.resource.type];

  const onClipMoment = () => {
    if (clippedAt != null) return;
    const at = Math.floor(position);
    addClip.mutate(
      { resource: playable.resource, mediaKind: 'audio', startSec: at, endSec: null, caption: null },
      {
        onSuccess: () => {
          setClippedAt(at);
          clipTimer.current = setTimeout(() => setClippedAt(null), 2500);
        },
      },
    );
  };

  const onShare = () => {
    Share.share({ message: `${playable.resource.title}\n${playable.resource.link}` }).catch(() => {});
  };

  const downloaded = download.data?.status === 'done';
  const downloading = startDownload.isPending;
  const onDownload = () => {
    if (downloading) return;
    if (downloaded) {
      Alert.alert('Remove download?', 'The audio file will be deleted from this device.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeDownload.mutate(playable.resource.key),
        },
      ]);
      return;
    }
    startDownload.mutate(playable, {
      onError: () => Alert.alert('Download failed', 'Check your connection and try again.'),
    });
  };
  const downloadLabel = downloading
    ? downloadProgress != null
      ? `${Math.round(downloadProgress * 100)}%`
      : 'Saving…'
    : downloaded
      ? 'Downloaded'
      : 'Download';

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#2A352E', '#202821', '#1A211C']} locations={[0, 0.46, 1]} style={StyleSheet.absoluteFill} />

      <View style={[styles.content, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 18 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()} hitSlop={8} accessibilityLabel="Close player">
            <ChevronDownIcon size={20} color={P.icon} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerKicker}>Playing from {CONTENT_TYPE_LABEL[playable.resource.type]}</Text>
            <Text style={styles.headerAlbum} numberOfLines={1}>
              {playable.album}
            </Text>
          </View>
          <Pressable style={styles.headerButton} onPress={onShare} hitSlop={8} accessibilityLabel="Share">
            <ShareIcon size={18} color={P.icon} />
          </Pressable>
        </View>

        {/* Artwork */}
        <View style={styles.artworkWrap}>
          {playable.artworkUrl ? (
            <Image source={{ uri: playable.artworkUrl }} style={styles.artwork} contentFit="cover" transition={200} />
          ) : (
            <View style={[styles.artwork, { backgroundColor: P.chip }]} />
          )}
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaText}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title} numberOfLines={3}>
              {playable.resource.title}
            </Text>
          </View>
          <Pressable
            style={styles.likeButton}
            onPress={() => toggleSaved.mutate(playable.resource)}
            hitSlop={6}
            accessibilityLabel={isSaved ? 'Remove from saved' : 'Save'}>
            <HeartIcon size={20} color={isSaved ? Colors.goldBright : P.icon} filled={isSaved} />
          </Pressable>
        </View>

        {/* Scrubber */}
        <SeekBar position={position} duration={duration} markers={clipMarkers} />

        {/* Transport */}
        <View style={styles.transport}>
          <Pressable style={styles.transportSide} onPress={() => cyclePlaybackRate().then(setRate)} hitSlop={8}>
            <Text style={styles.speedLabel}>{formatRate(rate)}</Text>
          </Pressable>
          <Pressable onPress={() => TrackPlayer.seekBy(-15)} hitSlop={8} accessibilityLabel="Back 15 seconds">
            <SkipBackIcon size={32} color="#EDE7D8" weight={1.6} />
          </Pressable>
          <Pressable style={styles.playButton} onPress={toggle} accessibilityLabel={playing ? 'Pause' : 'Play'}>
            {playing ? <PauseIcon size={24} color="#241F16" /> : <PlayIcon size={24} color="#241F16" />}
          </Pressable>
          <Pressable onPress={() => TrackPlayer.seekBy(30)} hitSlop={8} accessibilityLabel="Forward 30 seconds">
            <SkipForwardIcon size={32} color="#EDE7D8" weight={1.6} />
          </Pressable>
          <Pressable style={styles.transportSide} onPress={cycleSleepTimer} hitSlop={8} accessibilityLabel="Sleep timer">
            <MoonIcon size={22} color={sleepMinutesLeft != null ? Colors.goldBright : P.sub} />
            {sleepMinutesLeft != null ? <Text style={styles.sleepLabel}>{sleepMinutesLeft}m</Text> : null}
          </Pressable>
        </View>

        <View style={styles.spacer} />

        {/* Actions */}
        <View style={styles.actionsPanel}>
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.action, clippedAt != null && styles.actionActive]}
              onPress={onClipMoment}
              accessibilityLabel="Clip this moment">
              <NotebookIcon size={21} color={clippedAt != null ? '#E0A93A' : P.muted} />
              <Text style={[styles.actionLabel, clippedAt != null && styles.actionLabelActive]}>
                {clippedAt != null ? `Saved ${formatTime(clippedAt)}` : 'Clip moment'}
              </Text>
            </Pressable>
            <View style={[styles.action, styles.actionDisabled]}>
              <TranscriptIcon size={21} color={P.muted} />
              <Text style={styles.actionLabel}>Transcript</Text>
            </View>
            <Pressable style={styles.action} onPress={onShare}>
              <ShareIcon size={21} color={P.muted} />
              <Text style={styles.actionLabel}>Share</Text>
            </Pressable>
            <Pressable
              style={[styles.action, downloaded && styles.actionActive]}
              onPress={onDownload}
              accessibilityLabel={downloaded ? 'Remove download' : 'Download for offline listening'}>
              <DownloadIcon size={21} color={downloaded ? '#E0A93A' : P.muted} />
              <Text style={[styles.actionLabel, downloaded && styles.actionLabelActive]}>{downloadLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Touch-driven seek bar: drag previews the target, release commits the seek and
 * holds the bar at the target until playback catches up (no snap-back flicker).
 * `markers` are clipped moments, drawn as subtle dots on the track.
 */
function SeekBar({
  position,
  duration,
  markers = [],
}: {
  position: number;
  duration: number;
  markers?: readonly number[];
}) {
  const [width, setWidth] = useState(0);
  const [scrubFraction, setScrubFraction] = useState<number | null>(null);
  const [pendingFraction, setPendingFraction] = useState<number | null>(null);

  // Time-cap the hold in case the seek silently fails; the normal release below
  // is derived from playback catching up, not from state writes.
  useEffect(() => {
    if (pendingFraction == null) return;
    const timer = setTimeout(() => setPendingFraction(null), 3000);
    return () => clearTimeout(timer);
  }, [pendingFraction]);

  const caughtUp =
    pendingFraction != null && duration > 0 && Math.abs(position - pendingFraction * duration) < 1.5;
  const heldFraction = scrubFraction ?? (pendingFraction != null && !caughtUp ? pendingFraction : null);
  const fraction = heldFraction ?? (duration > 0 ? Math.min(1, position / duration) : 0);
  const shownPosition = heldFraction != null ? heldFraction * duration : position;

  const fractionFromEvent = (event: GestureResponderEvent) =>
    width > 0 ? Math.min(1, Math.max(0, event.nativeEvent.locationX / width)) : 0;

  return (
    <View style={styles.seekWrap}>
      <View
        style={styles.seekTouch}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => setScrubFraction(fractionFromEvent(e))}
        onResponderMove={(e) => setScrubFraction(fractionFromEvent(e))}
        onResponderRelease={(e) => {
          const target = fractionFromEvent(e);
          setScrubFraction(null);
          if (duration > 0) {
            setPendingFraction(target);
            TrackPlayer.seekTo(target * duration);
          }
        }}
        onResponderTerminate={() => setScrubFraction(null)}>
        {/* pointerEvents=none: touches must always target the bar itself, or
            locationX comes back relative to a 5px dot / the thumb and the seek
            math collapses to the child's left edge. */}
        <View style={styles.seekTrack} pointerEvents="none" />
        <View style={[styles.seekFill, { width: `${fraction * 100}%` }]} pointerEvents="none" />
        {markers.map((marker, index) => (
          <View key={index} style={[styles.seekMarker, { left: `${marker * 100}%` }]} pointerEvents="none" />
        ))}
        <View style={[styles.seekThumb, { left: `${fraction * 100}%` }]} pointerEvents="none" />
      </View>
      <View style={styles.timesRow}>
        <Text style={styles.time}>{formatTime(shownPosition)}</Text>
        <Text style={styles.time}>-{formatTime(Math.max(0, duration - shownPosition))}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1E2620',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: P.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  headerKicker: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: P.headerSub,
  },
  headerAlbum: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12.5,
    color: P.icon,
    marginTop: 2,
  },
  // Flexible: shrinks on short screens (SE-class) instead of pushing the
  // transport/actions off the bottom; caps at the mockup size on tall ones.
  artworkWrap: {
    paddingHorizontal: 30,
    paddingTop: 18,
    flexGrow: 4,
    flexShrink: 1,
    minHeight: 150,
    maxHeight: 320,
  },
  artwork: {
    width: '100%',
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(241,235,221,0.06)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  metaText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.goldBright,
  },
  title: {
    fontFamily: Fonts.serifBold,
    fontSize: 23,
    lineHeight: 26,
    color: P.fg,
    marginTop: 9,
  },
  likeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: P.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  seekWrap: {
    paddingHorizontal: 28,
    paddingTop: 22,
  },
  seekTouch: {
    height: 26,
    justifyContent: 'center',
  },
  seekTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 3,
    backgroundColor: P.track,
  },
  seekFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 3,
    backgroundColor: Colors.goldBright,
  },
  seekMarker: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    marginLeft: -2.5,
    top: 10.5,
    backgroundColor: 'rgba(241,235,221,0.55)',
  },
  seekThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    backgroundColor: P.fg,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  time: {
    fontFamily: Fonts.sans,
    fontSize: 11.5,
    color: P.sub,
    fontVariant: ['tabular-nums'],
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingTop: 14,
  },
  transportSide: {
    width: 46,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.goldBright,
  },
  // Absolutely positioned so appearing/disappearing never nudges the moon icon.
  sleepLabel: {
    position: 'absolute',
    bottom: -6,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 9.5,
    color: Colors.goldBright,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.goldBright,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  spacer: {
    flexGrow: 1,
    minHeight: 10,
  },
  actionsPanel: {
    marginHorizontal: 18,
    backgroundColor: P.panel,
    borderWidth: 1,
    borderColor: P.panelBorder,
    borderRadius: 18,
    padding: 6,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 13,
  },
  actionActive: {
    backgroundColor: 'rgba(200,148,31,0.16)',
  },
  actionDisabled: {
    opacity: 0.35,
  },
  actionLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    color: P.muted,
  },
  actionLabelActive: {
    color: '#E0A93A',
  },
});
