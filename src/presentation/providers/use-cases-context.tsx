import { createContext, useContext, type ReactNode } from 'react';

import type { UseCases } from '@/application/use-cases';

const UseCasesContext = createContext<UseCases | null>(null);

/** Provides the wired use cases to the UI. The concrete value comes from the composition root. */
export function UseCasesProvider({ value, children }: { value: UseCases; children: ReactNode }) {
  return <UseCasesContext.Provider value={value}>{children}</UseCasesContext.Provider>;
}

/** Access the application's use cases. Presentation depends on use cases, never on the data layer. */
export function useUseCases(): UseCases {
  const useCases = useContext(UseCasesContext);
  if (!useCases) {
    throw new Error('useUseCases must be used within an <AppProviders>/<UseCasesProvider>.');
  }
  return useCases;
}
