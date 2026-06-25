import { useInfiniteQuery } from '@tanstack/react-query';

import { useUseCases } from '@/presentation/providers/use-cases-context';

const PER_PAGE = 20;

/**
 * Infinite query over the unified resource feed. Pages are fetched on demand
 * (`fetchNextPage`) and flattened by the caller. Filtering by content type is done
 * client-side over loaded pages for now — the feed endpoint can't filter server-side.
 */
export function useResourceFeed() {
  const { getResourceFeed } = useUseCases();

  return useInfiniteQuery({
    queryKey: ['resource-feed'],
    queryFn: ({ pageParam }) => getResourceFeed({ page: pageParam, perPage: PER_PAGE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  });
}
