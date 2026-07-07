import {
  State,
  useActiveTrack,
  usePlaybackState,
  useProgress,
} from '@javascriptcommon/react-native-track-player';

import type { PlayableTrack } from '@/domain/playable';
import { playableFromTrack } from '@/presentation/playback/player';

export interface NowPlaying {
  /** The domain track behind the active player item, or null when idle. */
  readonly playable: PlayableTrack | null;
  readonly playing: boolean;
  readonly buffering: boolean;
  /** Seconds. Duration falls back to the resolved track's RSS duration until the player knows better. */
  readonly position: number;
  readonly duration: number;
}

/** Reactive snapshot of the player for the mini-player and Now Playing screen. */
export function useNowPlaying(progressIntervalSec = 1): NowPlaying {
  const track = useActiveTrack();
  const { state } = usePlaybackState();
  const { position, duration } = useProgress(progressIntervalSec * 1000);

  const playable = playableFromTrack(track);
  return {
    playable,
    playing: state === State.Playing,
    buffering: state === State.Buffering || state === State.Loading,
    position,
    duration: duration > 0 ? duration : (playable?.durationSec ?? 0),
  };
}
