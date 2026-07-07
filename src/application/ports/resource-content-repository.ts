import type { ResourceDetail } from '@/domain/resource-detail';
import type { ContentType } from '@/domain/resource';

/** Identifies a single resource to fetch in full (type routes the source; slug selects it). */
export interface ResourceContentQuery {
  readonly type: ContentType;
  readonly slug: string;
}

/**
 * The boundary the application depends on to read a single resource's full body,
 * without knowing the source (per-type WordPress `wp/v2/*?slug=` today). Sibling to
 * {@link ResourceRepository} (the feed); kept separate so each port stays focused.
 * Implemented in the data layer and injected by the composition root.
 */
export interface ResourceContentRepository {
  /** Resolve a resource by type + slug, or null when nothing matches. */
  getContent(query: ResourceContentQuery): Promise<ResourceDetail | null>;
}
