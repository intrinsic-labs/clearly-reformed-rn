import type { Page, ResourceFeedQuery, ResourceRepository } from '@/application/ports/resource-repository';
import type { Resource } from '@/domain/resource';
import type { AllResourcesItemDto } from '@/data/api/dto/all-resources.dto';
import { getList } from '@/data/api/http-client';
import { mapResource } from '@/data/api/mappers/resource-mapper';

const DEFAULT_PER_PAGE = 20;

/**
 * Reads the unified content feed from `kdy/v1/all-resources` and maps it onto the
 * domain. Implements the application's ResourceRepository port; the composition
 * root injects it, so nothing above the data layer knows about WordPress.
 */
export function createWordPressResourceRepository(): ResourceRepository {
  return {
    async getFeed(query: ResourceFeedQuery): Promise<Page<Resource>> {
      const perPage = query.perPage ?? DEFAULT_PER_PAGE;
      const { data, totalItems, totalPages } = await getList<AllResourcesItemDto[]>('/kdy/v1/all-resources', {
        per_page: perPage,
        page: query.page,
      });

      return {
        items: data.map(mapResource),
        page: query.page,
        totalItems,
        totalPages,
      };
    },
  };
}
