import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import type { UseCases } from '@/application/use-cases';
import { UseCasesProvider } from '@/presentation/providers/use-cases-context';

/**
 * App-wide providers: TanStack Query (server-state cache) + the use-cases DI context.
 * `useCases` is supplied by the composition root in the root layout.
 */
export function AppProviders({ useCases, children }: { useCases: UseCases; children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5 * 60 * 1000, retry: 2, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <UseCasesProvider value={useCases}>{children}</UseCasesProvider>
    </QueryClientProvider>
  );
}
