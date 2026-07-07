import type { ResourceRef } from '@/domain/resource-ref';

export interface SavedItem {
  readonly resource: ResourceRef;
  readonly savedAt: number;
}

/**
 * Saved/bookmarked content — the offline-first "my stuff" list. Saving is also the
 * trigger for offline caching (the content use case caches a saved item's body).
 */
export interface SavedRepository {
  save(resource: ResourceRef): Promise<void>;
  unsave(resourceKey: string): Promise<void>;
  /** Newest-first. */
  list(): Promise<readonly SavedItem[]>;
  isSaved(resourceKey: string): Promise<boolean>;
}
