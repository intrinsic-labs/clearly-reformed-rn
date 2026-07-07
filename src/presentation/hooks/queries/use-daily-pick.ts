import { useQuery } from '@tanstack/react-query';

import { useUseCases } from '@/presentation/providers/use-cases-context';

/** Today's pick — deterministic for the calendar day, so it caches until tomorrow. */
export function useDailyPick() {
  const { daily } = useUseCases();
  return useQuery({
    queryKey: ['daily-pick', new Date().toDateString()],
    queryFn: () => daily.getPick(),
    staleTime: 60 * 60 * 1000,
  });
}
