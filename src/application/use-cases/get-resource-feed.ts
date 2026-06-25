import type { Page, ResourceFeedQuery, ResourceRepository } from '@/application/ports/resource-repository';
import type { Resource } from '@/domain/resource';

/**
 * Use case: read a page of the unified resource feed. Pure orchestration over the
 * repository port — the composition root injects a concrete repository, so this
 * stays free of any API/framework detail.
 */
export function makeGetResourceFeed(repository: ResourceRepository) {
  return (query: ResourceFeedQuery): Promise<Page<Resource>> => repository.getFeed(query);
}

export type GetResourceFeed = ReturnType<typeof makeGetResourceFeed>;
