import { useQuery } from '@tanstack/react-query';

import { useUseCases } from '@/presentation/providers/use-cases-context';

/** The LBE RSS feed — weekly cadence, so it caches generously. */
export function usePodcastEpisodes() {
  const { podcast } = useUseCases();
  return useQuery({
    queryKey: ['podcast', 'episodes'],
    queryFn: () => podcast.getEpisodes(),
    staleTime: 60 * 60 * 1000,
  });
}
