import { useQuery } from '@tanstack/react-query';

import { useUseCases } from '@/presentation/providers/use-cases-context';

const STALE_MS = 5 * 60 * 1000;

/** Newest unseen pieces. `excludeKeys` keeps the hero from repeating below itself. */
export function useNewForYou(excludeKeys: readonly string[], limit = 3) {
  const { home } = useUseCases();
  return useQuery({
    queryKey: ['home', 'new-for-you', limit, excludeKeys],
    queryFn: () => home.getNewForYou(limit, excludeKeys),
    staleTime: STALE_MS,
  });
}

/** Taste-weighted backfill; empty until the notebook has something in it. */
export function useRecommendations(excludeKeys: readonly string[], limit = 4) {
  const { home } = useUseCases();
  return useQuery({
    queryKey: ['home', 'recommendations', limit, excludeKeys],
    queryFn: () => home.getRecommendations(limit, excludeKeys),
    staleTime: STALE_MS,
  });
}
