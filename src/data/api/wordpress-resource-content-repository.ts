import type {
  ResourceContentQuery,
  ResourceContentRepository,
} from '@/application/ports/resource-content-repository';
import type { ResourceDetail } from '@/domain/resource-detail';
import type { ResourceDetailDto } from '@/data/api/dto/resource-detail.dto';
import { TYPE_PATH } from '@/data/api/endpoints';
import { getList } from '@/data/api/http-client';
import { mapResourceDetail } from '@/data/api/mappers/resource-detail-mapper';

/**
 * Reads a single resource's full body from WordPress and maps it onto the domain.
 * Implements the application's ResourceContentRepository port; the composition root
 * injects it, so nothing above the data layer knows about WordPress.
 *
 * `wp/v2/{type}?slug=` returns an array (slugs are unique per type), so we take the
 * first item — or null when the slug doesn't resolve.
 */
export function createWordPressResourceContentRepository(): ResourceContentRepository {
  return {
    async getContent(query: ResourceContentQuery): Promise<ResourceDetail | null> {
      const { data } = await getList<ResourceDetailDto[]>(TYPE_PATH[query.type], {
        slug: query.slug,
      });

      const dto = data[0];
      return dto ? mapResourceDetail(dto) : null;
    },
  };
}
