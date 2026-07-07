import type { UseCases } from '@/application/use-cases';
import { makeGetResourceContent } from '@/application/use-cases/get-resource-content';
import { makeGetResourceFeed } from '@/application/use-cases/get-resource-feed';
import { createWordPressResourceContentRepository } from '@/data/api/wordpress-resource-content-repository';
import { createWordPressResourceRepository } from '@/data/api/wordpress-resource-repository';

/**
 * Composition root: the one place that knows the concrete implementations. It wires
 * data-layer repositories into application use cases and hands the result to the UI
 * (via the DI context). This is the "main" — the only module allowed to depend on
 * every layer.
 */
export function createContainer(): { useCases: UseCases } {
  const resourceRepository = createWordPressResourceRepository();
  const resourceContentRepository = createWordPressResourceContentRepository();

  const useCases: UseCases = {
    getResourceFeed: makeGetResourceFeed(resourceRepository),
    getResourceContent: makeGetResourceContent(resourceContentRepository),
  };

  return { useCases };
}
