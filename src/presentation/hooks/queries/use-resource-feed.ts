import { useInfiniteQuery } from '@tanstack/react-query';

import type { FeedOrder } from '@/application/ports/resource-repository';
import type { ContentType } from '@/domain/resource';
import { useUseCases } from '@/presentation/providers/use-cases-context';

const PER_PAGE = 20;

/**
 * Infinite query over the resource feed. With no `type` it reads the unified
 * `all-resources` feed; with a `type` it reads that type's own paginated endpoint —
 * so `hasNextPage` reflects the true end of that type (no client-side filtering).
 * `order` defaults to newest-first.
 */
export function useResourceFeed(type?: ContentType, order: FeedOrder = 'newest') {
  const { content } = useUseCases();

  return useInfiniteQuery({
    queryKey: ['resource-feed', type ?? 'all', order],
    queryFn: ({ pageParam }) => content.getFeed({ page: pageParam, perPage: PER_PAGE, type, order }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });
}
