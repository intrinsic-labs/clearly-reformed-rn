import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ResourceDetail } from '@/domain/resource-detail';
import type { ResourceRef } from '@/domain/resource-ref';
import { useUseCases } from '@/presentation/providers/use-cases-context';

export function useSavedList() {
  const { saved } = useUseCases();
  return useQuery({
    queryKey: ['saved', 'list'],
    queryFn: () => saved.list(),
  });
}

export function useIsSaved(resourceKey: string | undefined) {
  const { saved } = useUseCases();
  return useQuery({
    queryKey: ['saved', 'is', resourceKey],
    queryFn: () => saved.isSaved(resourceKey!),
    enabled: Boolean(resourceKey),
  });
}

export interface ToggleSavedInput {
  readonly resource: ResourceRef;
  /** The open body, when the caller has it — cached for offline without a refetch. */
  readonly detail?: ResourceDetail | null;
}

export function useToggleSaved() {
  const { saved } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resource, detail }: ToggleSavedInput) => saved.toggle(resource, detail),
    // Flip the icon at once: saving may wait on a body fetch for offline, and a
    // stale icon invites a second tap that would undo the save.
    onMutate: ({ resource }) => {
      const key = ['saved', 'is', resource.key];
      const previous = queryClient.getQueryData<boolean>(key);
      queryClient.setQueryData(key, !previous);
      return { previous };
    },
    onError: (_error, { resource }, context) => {
      queryClient.setQueryData(['saved', 'is', resource.key], context?.previous);
    },
    onSuccess: (result, { resource }) => {
      queryClient.setQueryData(['saved', 'is', resource.key], result.saved);
      queryClient.invalidateQueries({ queryKey: ['saved', 'list'] });
      // The offline search index gained or lost this body.
      queryClient.invalidateQueries({ queryKey: ['search', 'offline'] });
      // Saved items are both a Home taste signal and part of its "seen" set.
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}
