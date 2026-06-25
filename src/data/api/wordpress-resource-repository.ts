import type { Page, ResourceFeedQuery, ResourceRepository } from '@/application/ports/resource-repository';
import type { ContentType, Resource } from '@/domain/resource';
import type { AllResourcesItemDto } from '@/data/api/dto/all-resources.dto';
import { getList } from '@/data/api/http-client';
import { mapResource } from '@/data/api/mappers/resource-mapper';

const DEFAULT_PER_PAGE = 20;

/** The unified chronological feed (all content types). */
const ALL_RESOURCES_PATH = '/kdy/v1/all-resources';

/**
 * Per-type endpoints for filtered views. They return the *same* normalized shape as
 * the unified feed (human dates, plain excerpt, `featured_image_url`, `people_display`)
 * — confirmed by probe — so the same DTO + mapper apply. Crucially, each paginates to
 * its own type, so the feed knows its true end (no client-side filtering).
 */
const TYPE_PATH: Record<ContentType, string> = {
  article: '/wp/v2/posts',
  video: '/wp/v2/explainer-video',
  podcast: '/wp/v2/podcast_episode',
  sermon: '/wp/v2/sermon',
  'sermon-clip': '/wp/v2/sermon-clip',
  lecture: '/wp/v2/lecture',
  conference: '/wp/v2/conference',
  book: '/wp/v2/book',
  event: '/wp/v2/event',
};

/**
 * Reads the content feed from WordPress and maps it onto the domain. Implements the
 * application's ResourceRepository port; the composition root injects it, so nothing
 * above the data layer knows about WordPress.
 */
export function createWordPressResourceRepository(): ResourceRepository {
  return {
    async getFeed(query: ResourceFeedQuery): Promise<Page<Resource>> {
      const perPage = query.perPage ?? DEFAULT_PER_PAGE;
      const path = query.type ? TYPE_PATH[query.type] : ALL_RESOURCES_PATH;

      const { data, totalItems, totalPages } = await getList<AllResourcesItemDto[]>(path, {
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
