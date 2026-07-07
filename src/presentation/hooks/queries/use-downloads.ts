import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type { PlayableTrack } from '@/domain/playable';
import { useUseCases } from '@/presentation/providers/use-cases-context';

/** One resource's download record (drives the Download button state). */
export function useDownload(resourceKey: string | undefined) {
  const { downloads } = useUseCases();
  return useQuery({
    queryKey: ['downloads', 'item', resourceKey],
    queryFn: () => downloads.get(resourceKey!),
    enabled: Boolean(resourceKey),
  });
}

export function useDownloadsList() {
  const { downloads } = useUseCases();
  return useQuery({
    queryKey: ['downloads', 'list'],
    queryFn: () => downloads.list(),
  });
}

/** Start/remove downloads; exposes a live 0..1 progress fraction while downloading. */
export function useDownloadMutations() {
  const { downloads } = useUseCases();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['downloads'] });

  const start = useMutation({
    mutationFn: (track: PlayableTrack) => {
      setProgress(0);
      return downloads.start(track, ({ bytesWritten, totalBytes }) => {
        if (totalBytes && totalBytes > 0) setProgress(Math.min(1, bytesWritten / totalBytes));
      });
    },
    onSettled: () => {
      setProgress(null);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (resourceKey: string) => downloads.remove(resourceKey),
    onSettled: invalidate,
  });

  return { start, remove, progress };
}
