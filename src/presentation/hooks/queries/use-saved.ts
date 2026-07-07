import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export function useToggleSaved() {
  const { saved } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resource: ResourceRef) => saved.toggle(resource),
    onSuccess: (nowSaved, resource) => {
      queryClient.setQueryData(['saved', 'is', resource.key], nowSaved);
      queryClient.invalidateQueries({ queryKey: ['saved', 'list'] });
    },
  });
}
