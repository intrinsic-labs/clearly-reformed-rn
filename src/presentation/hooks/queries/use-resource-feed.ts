import { useInfiniteQuery } from '@tanstack/react-query';

import type { ContentType } from '@/domain/resource';
import { useUseCases } from '@/presentation/providers/use-cases-context';

const PER_PAGE = 20;

/**
 * Infinite query over the resource feed. With no `type` it reads the unified
 * `all-resources` feed; with a `type` it reads that type's own paginated endpoint —
 * so `hasNextPage` reflects the true end of that type (no client-side filtering).
 */
export function useResourceFeed(type?: ContentType) {
  const { getResourceFeed } = useUseCases();

  return useInfiniteQuery({
    queryKey: ['resource-feed', type ?? 'all'],
    queryFn: ({ pageParam }) => getResourceFeed({ page: pageParam, perPage: PER_PAGE, type }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });
}
