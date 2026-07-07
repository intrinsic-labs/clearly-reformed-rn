import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  type AddTrack,
  type Track,
} from '@javascriptcommon/react-native-track-player';

import type { PlayableTrack } from '@/domain/playable';

/**
 * Thin imperative layer over react-native-track-player: one-time setup, and the
 * mapping between the domain's PlayableTrack and the player's Track. Everything
 * stateful/reactive lives in the hooks next door; persistence lives in
 * PlaybackBootstrap via the progress use case.
 */

let ready: Promise<void> | null = null;

/** Idempotent player setup (safe to await from anywhere before a player call). */
export function ensurePlayerReady(): Promise<void> {
  if (!ready) ready = setup();
  return ready;
}

async function setup(): Promise<void> {
  try {
    await TrackPlayer.setupPlayer();
  } catch (error) {
    // Hot reloads re-run JS while the native player stays initialized.
    if (!String(error).includes('already been initialized')) throw error;
  }
  await TrackPlayer.updateOptions({
    android: { appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback },
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.JumpForward,
      Capability.JumpBackward,
      Capability.SeekTo,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause, Capability.JumpForward],
    forwardJumpInterval: 30,
    backwardJumpInterval: 15,
  });
}

/** Custom key carrying the domain track on the player's Track object. */
const PLAYABLE_KEY = 'playable';

export function toPlayerTrack(playable: PlayableTrack, url = playable.audioUrl): AddTrack {
  return {
    url,
    title: playable.resource.title,
    artist: playable.artist,
    album: playable.album,
    artwork: playable.artworkUrl ?? undefined,
    duration: playable.durationSec ?? undefined,
    [PLAYABLE_KEY]: playable,
  };
}

export function playableFromTrack(track: Track | undefined): PlayableTrack | null {
  const playable = track?.[PLAYABLE_KEY] as PlayableTrack | undefined;
  return playable ?? null;
}

/**
 * Load a track (replacing the queue) without starting playback — cold-launch
 * restore for the mini-player. Returns quietly if something is already loaded.
 */
export async function restoreTrack(playable: PlayableTrack, positionSec: number, url?: string): Promise<void> {
  await ensurePlayerReady();
  const queue = await TrackPlayer.getQueue();
  if (queue.length > 0) return;
  await TrackPlayer.add(toPlayerTrack(playable, url));
  if (positionSec > 0) await TrackPlayer.seekTo(positionSec);
}

/** Start (or resume) a track, replacing the queue if it isn't the active one. */
export async function startTrack(playable: PlayableTrack, startAtSec: number, url?: string): Promise<void> {
  await ensurePlayerReady();
  const active = playableFromTrack(await TrackPlayer.getActiveTrack());
  if (active?.resource.key === playable.resource.key) {
    await TrackPlayer.play();
    return;
  }
  await TrackPlayer.reset();
  await TrackPlayer.add(toPlayerTrack(playable, url));
  // Rewind slightly so resuming replays the last beat of context.
  if (startAtSec > 5) await TrackPlayer.seekTo(Math.max(0, startAtSec - 3));
  await TrackPlayer.play();
}

export const PLAYBACK_RATES = [1, 1.25, 1.5, 1.75, 2] as const;

/** Advance to the next rate in the cycle; resolves to the new rate. */
export async function cyclePlaybackRate(): Promise<number> {
  const current = await TrackPlayer.getRate();
  // Float drift from the native side: match against the closest option.
  const index = PLAYBACK_RATES.findIndex((rate) => Math.abs(rate - current) < 0.01);
  const next = PLAYBACK_RATES[(index + 1) % PLAYBACK_RATES.length];
  await TrackPlayer.setRate(next);
  return next;
}
