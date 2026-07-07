import type { ContentType } from '@/domain/resource';
import type { ResourceDetail } from '@/domain/resource-detail';

/**
 * Local cache of full resource bodies for offline reading. Written when a saved
 * item's content is fetched; read as the fallback when the network fails. Not part
 * of the synced personal layer — purely a device-local cache.
 */
export interface ContentCache {
  put(detail: ResourceDetail): Promise<void>;
  get(type: ContentType, slug: string): Promise<ResourceDetail | null>;
  remove(resourceKey: string): Promise<void>;
  /** Full-text search over cached titles/bodies (offline search). */
  search(term: string): Promise<readonly ResourceDetail[]>;
}
