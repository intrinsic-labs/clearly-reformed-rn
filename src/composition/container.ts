import type { UseCases } from '@/application/use-cases';
import { makeGetResourceFeed } from '@/application/use-cases/get-resource-feed';
import { createWordPressResourceRepository } from '@/data/api/wordpress-resource-repository';

/**
 * Composition root: the one place that knows the concrete implementations. It wires
 * data-layer repositories into application use cases and hands the result to the UI
 * (via the DI context). This is the "main" — the only module allowed to depend on
 * every layer.
 */
export function createContainer(): { useCases: UseCases } {
  const resourceRepository = createWordPressResourceRepository();

  const useCases: UseCases = {
    getResourceFeed: makeGetResourceFeed(resourceRepository),
  };

  return { useCases };
}
