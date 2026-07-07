import {
  Event,
  State,
  useProgress,
  useTrackPlayerEvents,
} from '@javascriptcommon/react-native-track-player';
import { useEffect, useRef } from 'react';

import { ensurePlayerReady, playableFromTrack, restoreTrack } from '@/presentation/playback/player';
import { useNowPlaying } from '@/presentation/playback/use-now-playing';
import { useInvalidateProgress } from '@/presentation/hooks/queries/use-progress';
import { useUseCases } from '@/presentation/providers/use-cases-context';

/**
 * Invisible root-level component that ties the player to the personal layer:
 *
 *  1. On cold launch, restores the most recent audio session into the player
 *     (paused, at its saved position) so the mini-player always offers "continue".
 *  2. While playing, persists the position every few seconds and on pause/end —
 *     that stream of writes is what powers Continue and cross-content resume.
 */
export function PlaybackBootstrap() {
  const { progress } = useUseCases();
  const invalidateProgress = useInvalidateProgress();
  const { playable, playing, duration } = useNowPlaying(5);
  const { position } = useProgress(5000);
  const restored = useRef(false);

  // 1. Cold-launch restore (from the downloaded file when one exists).
  const { downloads } = useUseCases();
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    (async () => {
      try {
        await ensurePlayerReady();
        const latest = await progress.latestListen();
        if (latest?.playable && !latest.progress.completed) {
          const url = await downloads.resolvePlaybackUrl(latest.playable.resource.key, latest.playable.audioUrl);
          await restoreTrack(latest.playable, latest.progress.position, url);
        }
      } catch {
        // A failed restore must never block startup; the player just starts empty.
      }
    })();
  }, [progress, downloads]);

  // 2. Periodic persistence while playing (5s cadence from useProgress above).
  const lastSaved = useRef(-1);
  useEffect(() => {
    if (!playing || !playable || duration <= 0) return;
    if (Math.abs(position - lastSaved.current) < 2) return;
    lastSaved.current = position;
    progress.save({ resource: playable.resource, kind: 'listen', position, length: duration, playable });
  }, [playing, playable, position, duration, progress]);

  // Boundary saves: pause, end, and track changes refresh the Continue views.
  useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.type === Event.PlaybackState && event.state !== State.Paused && event.state !== State.Ended) {
      return;
    }
    if (playable && duration > 0) {
      const finalPosition = event.type === Event.PlaybackState && event.state === State.Ended ? duration : position;
      await progress.save({
        resource: playable.resource,
        kind: 'listen',
        position: finalPosition,
        length: duration,
        playable,
      });
    }
    invalidateProgress();
  });

  // Handle track-change saves for the *previous* track via the event payload.
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    const previous = playableFromTrack(event.lastTrack);
    if (previous && event.lastPosition > 0) {
      const length = event.lastTrack?.duration ?? previous.durationSec ?? 0;
      await progress.save({
        resource: previous.resource,
        kind: 'listen',
        position: event.lastPosition,
        length,
        playable: previous,
      });
      invalidateProgress();
    }
  });

  return null;
}
