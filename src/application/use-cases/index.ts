import type { GetResourceFeed } from '@/application/use-cases/get-resource-feed';

/**
 * The application's use cases as a single injectable bag. The composition root
 * builds it (wiring concrete repositories); the presentation layer consumes it
 * through a DI context. Grows one entry per use case as features land.
 */
export interface UseCases {
  readonly getResourceFeed: GetResourceFeed;
}
