import type {
  ResourceContentQuery,
  ResourceContentRepository,
} from '@/application/ports/resource-content-repository';
import type { ResourceDetail } from '@/domain/resource-detail';

/**
 * Use case: read a single resource in full for the detail/Reader screen. Pure
 * orchestration over the content repository port — the composition root injects the
 * concrete repository, so this stays free of any API/framework detail.
 */
export function makeGetResourceContent(repository: ResourceContentRepository) {
  return (query: ResourceContentQuery): Promise<ResourceDetail | null> => repository.getContent(query);
}

export type GetResourceContent = ReturnType<typeof makeGetResourceContent>;
