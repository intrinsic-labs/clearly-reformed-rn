import { useQuery } from '@tanstack/react-query';

import type { ResourceDetail } from '@/domain/resource-detail';
import { resourceKey } from '@/domain/resource-ref';
import { useUseCases } from '@/presentation/providers/use-cases-context';

/**
 * Resolve a detail's playable audio (inline file or RSS-matched episode). Null data
 * means the resource simply has no audio — that's how screens decide whether to
 * show a play button.
 */
export function useResolvedTrack(detail: ResourceDetail | null | undefined) {
  const { podcast } = useUseCases();
  return useQuery({
    queryKey: ['resolved-track', detail ? resourceKey(detail.type, detail.id) : 'none'],
    queryFn: () => podcast.resolveTrack(detail!),
    enabled: Boolean(detail),
    staleTime: 60 * 60 * 1000,
  });
}
