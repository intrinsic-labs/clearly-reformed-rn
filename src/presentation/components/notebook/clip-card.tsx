import { Image } from 'expo-image';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import type { ClipEntry } from '@/domain/notebook';
import { CONTENT_TYPE_LABEL, ContentTypeIcon } from '@/presentation/components/content-icons';
import { PlayIcon } from '@/presentation/components/icons';
import { cardShellStyles, NotebookCardShell } from '@/presentation/components/notebook/card-shell';
import { SourceRow } from '@/presentation/components/notebook/source-row';
import { formatTime, relativeDate } from '@/presentation/lib/format';
import { Colors, Fonts, Radius } from '@/presentation/theme';

/** Decorative waveform heights, from the mockup. */
const WAVE = [6, 10, 15, 11, 18, 22, 16, 9, 13, 20, 24, 17, 12, 8, 14, 19, 23, 15, 10, 7, 12, 18, 21, 14, 9, 11, 16, 20, 13, 8];
const WAVE_PLAYED_TO = 11;

export function ClipCard({
  entry,
  onPlay,
  onOpenSource,
  onLongPress,
}: {
  entry: ClipEntry;
  onPlay: () => void;
  onOpenSource: () => void;
  onLongPress?: () => void;
}) {
  const range = entry.endSec != null ? `${formatTime(entry.startSec)}–${formatTime(entry.endSec)}` : formatTime(entry.startSec);
  const label = `Clip · ${entry.mediaKind === 'video' ? 'Video' : CONTENT_TYPE_LABEL[entry.resource.type]}`;

  return (
    <NotebookCardShell
      icon={<ContentTypeIcon type={entry.resource.type} size={13} />}
      label={label}
      when={relativeDate(entry.createdAt)}
      onPress={entry.mediaKind === 'audio' ? onPlay : onOpenSource}
      onLongPress={onLongPress}>
      {entry.mediaKind === 'audio' ? (
        <Pressable style={styles.playerChip} onPress={onPlay} accessibilityLabel={`Play clip at ${range}`}>
          <View style={styles.playButton}>
            <PlayIcon size={13} color="#241F16" />
          </View>
          <View style={styles.wave}>
            {WAVE.map((height, index) => (
              <View
                key={index}
                style={[
                  styles.waveBar,
                  { height, backgroundColor: index <= WAVE_PLAYED_TO ? Colors.goldBright : 'rgba(241,235,221,0.32)' },
                ]}
              />
            ))}
          </View>
          <Text style={styles.range}>{range}</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.videoRow} onPress={onOpenSource}>
          <View style={styles.videoThumbWrap}>
            {entry.resource.thumbnailUrl ? (
              <Image source={{ uri: entry.resource.thumbnailUrl }} style={styles.videoThumb} contentFit="cover" />
            ) : (
              <View style={[styles.videoThumb, { backgroundColor: Colors.borderSoft }]} />
            )}
            <View style={styles.videoPlayOverlay}>
              <View style={styles.videoPlayCircle}>
                <PlayIcon size={10} color={Colors.white} />
              </View>
            </View>
            <View style={styles.rangeBadge}>
              <Text style={styles.rangeBadgeLabel}>{range}</Text>
            </View>
          </View>
          {entry.caption ? (
            <Text style={styles.videoCaption} numberOfLines={4}>
              “{entry.caption}”
            </Text>
          ) : (
            <Text style={styles.videoCaptionMuted} numberOfLines={3}>
              A saved moment in this video.
            </Text>
          )}
        </Pressable>
      )}

      {entry.mediaKind === 'audio' && entry.caption ? <Text style={styles.caption}>“{entry.caption}”</Text> : null}

      <View style={cardShellStyles.divider} />
      <SourceRow resource={entry.resource} onPress={onOpenSource} />
    </NotebookCardShell>
  );
}

const styles = StyleSheet.create({
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: Colors.green,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: 13,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: Colors.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  wave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    height: 26,
  },
  waveBar: {
    flex: 1,
    borderRadius: 2,
  },
  range: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.2,
    color: '#E7D7B0',
    fontVariant: ['tabular-nums'],
  },
  caption: {
    fontFamily: Fonts.serifText,
    fontSize: 15,
    lineHeight: 22.5,
    color: '#3A3327',
    marginTop: 13,
  },
  videoRow: {
    flexDirection: 'row',
    gap: 13,
    marginTop: 13,
  },
  videoThumbWrap: {
    width: 104,
    height: 74,
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(26,32,28,0.5)',
    borderWidth: 1.3,
    borderColor: 'rgba(255,255,255,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  rangeBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(26,32,28,0.82)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  rangeBadgeLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 10,
    color: Colors.background,
    fontVariant: ['tabular-nums'],
  },
  videoCaption: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.serifText,
    fontSize: 14,
    lineHeight: 20.5,
    color: '#3A3327',
  },
  videoCaptionMuted: {
    flex: 1,
    minWidth: 0,
    fontFamily: Fonts.serifText,
    fontSize: 14,
    lineHeight: 20.5,
    color: Colors.textMuted,
  },
});
