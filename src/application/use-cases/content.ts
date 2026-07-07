import type { ContentCache } from '@/application/ports/content-cache';
import type {
  ResourceContentQuery,
  ResourceContentRepository,
} from '@/application/ports/resource-content-repository';
import type { Page, ResourceFeedQuery, ResourceRepository } from '@/application/ports/resource-repository';
import type { SavedRepository } from '@/application/ports/saved-repository';
import type { Resource } from '@/domain/resource';
import type { ResourceDetail } from '@/domain/resource-detail';
import { resourceKey } from '@/domain/resource-ref';

export interface ContentUseCases {
  /** A page of the unified feed (or one type's own paginated feed). */
  getFeed(query: ResourceFeedQuery): Promise<Page<Resource>>;
  /**
   * A single resource in full. Network-first; on success the body is cached locally
   * when the item is saved (offline reading), and on network failure the cache is
   * the fallback — so saved content keeps working with no connection.
   */
  getDetail(query: ResourceContentQuery): Promise<ResourceDetail | null>;
}

export function makeContentUseCases(
  resources: ResourceRepository,
  content: ResourceContentRepository,
  cache: ContentCache,
  saved: SavedRepository,
): ContentUseCases {
  return {
    getFeed: (query) => resources.getFeed(query),

    async getDetail(query) {
      try {
        const detail = await content.getContent(query);
        if (detail && (await saved.isSaved(resourceKey(detail.type, detail.id)))) {
          // Best-effort: a cache failure must never break reading.
          cache.put(detail).catch(() => {});
        }
        return detail;
      } catch (error) {
        const cached = await cache.get(query.type, query.slug).catch(() => null);
        if (cached) return cached;
        throw error;
      }
    },
  };
}
