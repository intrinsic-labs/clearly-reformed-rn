import type { SearchRepository } from '@/application/ports/search-repository';
import type { Resource } from '@/domain/resource';
import { getList } from '@/data/api/http-client';
import { decodeEntities, toContentType } from '@/data/api/mappers/resource-mapper';

/**
 * Keyword search over `wp/v2/search`. The kdy plugin enriches results with the same
 * normalized card fields as the feeds (image, plain excerpt, human date); `subtype`
 * carries the real post type (`type` is always "post"), and the slug is recovered
 * from the canonical URL's last path segment.
 */
export function createWordPressSearchRepository(): SearchRepository {
  return {
    async search(term: string): Promise<readonly Resource[]> {
      const { data } = await getList<SearchResultDto[]>('/wp/v2/search', {
        search: term,
        per_page: 30,
      });
      return data.map(mapSearchResult).filter((r): r is Resource => r !== null);
    },
  };
}

/** Raw `wp/v2/search` item (kdy-enriched), per live probe. */
interface SearchResultDto {
  readonly id: number;
  readonly title: string;
  readonly url: string;
  readonly subtype: string;
  readonly featured_image_url?: string | null;
  readonly excerpt?: string;
  readonly date?: string;
}

export function mapSearchResult(dto: SearchResultDto): Resource | null {
  const slug = slugFromUrl(dto.url);
  if (!slug) return null;
  const imageUrl = dto.featured_image_url || null;

  return {
    id: dto.id,
    type: toContentType(dto.subtype),
    title: decodeEntities(dto.title),
    slug,
    excerpt: dto.excerpt ? decodeEntities(dto.excerpt) : '',
    imageUrl,
    thumbnailUrl: imageUrl,
    displayDate: dto.date ?? '',
    people: [],
    link: dto.url,
    videoUrl: null,
    scriptureRef: null,
  };
}

/** Last non-empty path segment of the canonical URL. */
function slugFromUrl(url: string): string | null {
  const match = /\/([^/]+)\/?$/.exec(url.replace(/[?#].*$/, ''));
  return match ? match[1] : null;
}
