import TrackPlayer, { State } from '@javascriptcommon/react-native-track-player';
import { useCallback } from 'react';

import type { PlayableTrack } from '@/domain/playable';
import { startTrack } from '@/presentation/playback/player';
import { useInvalidateProgress } from '@/presentation/hooks/queries/use-progress';
import { useUseCases } from '@/presentation/providers/use-cases-context';

/**
 * The one way UI starts audio: resumes from stored progress ("Continue"), records
 * the session immediately (so the mini-player restores it after a relaunch), and
 * refreshes progress-derived views.
 */
export function usePlayer() {
  const { progress } = useUseCases();
  const invalidateProgress = useInvalidateProgress();

  const play = useCallback(
    async (playable: PlayableTrack) => {
      const stored = await progress.get(playable.resource.key);
      const resumeAt = stored && stored.kind === 'listen' && !stored.completed ? stored.position : 0;

      await startTrack(playable, resumeAt);

      const length = playable.durationSec ?? stored?.length ?? 0;
      await progress.save({
        resource: playable.resource,
        kind: 'listen',
        position: resumeAt,
        length,
        playable,
      });
      invalidateProgress();
    },
    [progress, invalidateProgress],
  );

  const toggle = useCallback(async () => {
    const { state } = await TrackPlayer.getPlaybackState();
    if (state === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }, []);

  return { play, toggle };
}
