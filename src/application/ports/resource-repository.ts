import type { ContentType, Resource } from '@/domain/resource';

/** A page of results from a paginated source. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

/** Parameters for a feed request. */
export interface ResourceFeedQuery {
  readonly page: number;
  readonly perPage?: number;
  /** Optional filter by content type (the Library filter chips). */
  readonly type?: ContentType;
}

/**
 * The boundary the application depends on to read the unified content feed, without
 * knowing the source (WordPress REST today; a local SQLite cache later). Implemented
 * in the data layer and injected by the composition root.
 *
 * Only `getFeed` is needed for the Library slice. Detail/Reader, audio, and search
 * will add sibling ports (e.g. ResourceContentRepository → per-type `wp/v2` body
 * text; PodcastRepository → RSS enclosures; SearchRepository → `wp/v2/search`) as
 * those slices land — kept separate so each port stays focused.
 */
export interface ResourceRepository {
  getFeed(query: ResourceFeedQuery): Promise<Page<Resource>>;
}
