import TrackPlayer from '@javascriptcommon/react-native-track-player';
import { useCallback, useState } from 'react';

import type { ClipEntry } from '@/domain/notebook';
import { usePlayer } from '@/presentation/playback/use-player';
import { useUseCases } from '@/presentation/providers/use-cases-context';

/**
 * Play a notebook audio clip: re-resolve the source's track (detail + RSS match),
 * start it, and jump to the clipped moment. Returns a pending flag so the card can
 * show progress while resolution happens.
 */
export function usePlayClip() {
  const { content, podcast } = useUseCases();
  const { play } = usePlayer();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const playClip = useCallback(
    async (clip: ClipEntry): Promise<boolean> => {
      setPendingId(clip.id);
      try {
        const detail = await content.getDetail({ type: clip.resource.type, slug: clip.resource.slug });
        if (!detail) return false;
        const track = await podcast.resolveTrack(detail);
        if (!track) return false;
        await play(track);
        await TrackPlayer.seekTo(clip.startSec);
        return true;
      } catch {
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [content, podcast, play],
  );

  return { playClip, pendingId };
}
