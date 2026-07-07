import { useQuery } from '@tanstack/react-query';

import type { ContentType } from '@/domain/resource';
import { useUseCases } from '@/presentation/providers/use-cases-context';

/**
 * Fetches a single resource in full for the detail/Reader screen. Disabled until both
 * `type` and `slug` are known (route params resolve asynchronously). Body HTML is
 * stable, so it caches generously.
 */
export function useResourceContent(type: ContentType | undefined, slug: string | undefined) {
  const { getResourceContent } = useUseCases();

  return useQuery({
    queryKey: ['resource-content', type, slug],
    queryFn: () => getResourceContent({ type: type!, slug: slug! }),
    enabled: Boolean(type && slug),
    staleTime: 60 * 60 * 1000,
  });
}
