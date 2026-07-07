import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useUseCases } from '@/presentation/providers/use-cases-context';

/** Keyword search across the corpus (`wp/v2/search`). */
export function useSearchResults(term: string) {
  const { search } = useUseCases();
  return useQuery({
    queryKey: ['search', 'remote', term],
    queryFn: () => search.remote(term),
    enabled: term.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/** Offline fallback: FTS over locally cached (saved) content. */
export function useOfflineSearchResults(term: string, enabled: boolean) {
  const { search } = useUseCases();
  return useQuery({
    queryKey: ['search', 'offline', term],
    queryFn: () => search.saved(term),
    enabled: enabled && term.trim().length >= 2,
  });
}

/** Debounce a rapidly-changing input value (search-as-you-type). */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
