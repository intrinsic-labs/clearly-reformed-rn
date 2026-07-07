import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useUseCases } from '@/presentation/providers/use-cases-context';

/** The cross-content Continue rail (Home). */
export function useContinueList(limit = 10) {
  const { progress } = useUseCases();
  return useQuery({
    queryKey: ['progress', 'continue', limit],
    queryFn: () => progress.listContinue(limit),
  });
}

/** A single resource's stored progress (Reader restore, card progress bars). */
export function useResourceProgress(resourceKey: string | undefined) {
  const { progress } = useUseCases();
  return useQuery({
    queryKey: ['progress', 'item', resourceKey],
    queryFn: () => progress.get(resourceKey!),
    enabled: Boolean(resourceKey),
  });
}

/**
 * Invalidate progress-derived views. Position reports are frequent, so callers
 * invalidate on meaningful boundaries (pause, screen exit) — not on every tick.
 */
export function useInvalidateProgress() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['progress'] });
}
