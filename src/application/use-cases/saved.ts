import type { ContentCache } from '@/application/ports/content-cache';
import type { ResourceContentRepository } from '@/application/ports/resource-content-repository';
import type { SavedItem, SavedRepository } from '@/application/ports/saved-repository';
import type { ResourceDetail } from '@/domain/resource-detail';
import type { ResourceRef } from '@/domain/resource-ref';

/**
 * The outcome of a save toggle. `offline` is true only when the body was
 * actually written to the offline cache — never assumed from the save itself.
 */
export interface SaveToggleResult {
  readonly saved: boolean;
  readonly offline: boolean;
}

export interface SavedUseCases {
  /**
   * Flip the saved state. Saving also keeps the body for offline reading and
   * offline search: from `detail` when the caller already has it open (no extra
   * fetch), otherwise fetched now. Unsaving drops that cached body and its
   * search entry; highlights, notes and progress are separate and untouched.
   */
  toggle(resource: ResourceRef, detail?: ResourceDetail | null): Promise<SaveToggleResult>;
  list(): Promise<readonly SavedItem[]>;
  isSaved(resourceKey: string): Promise<boolean>;
}

export function makeSavedUseCases(
  repository: SavedRepository,
  cache: ContentCache,
  content: ResourceContentRepository,
): SavedUseCases {
  async function keepOffline(resource: ResourceRef, detail?: ResourceDetail | null): Promise<boolean> {
    try {
      const body = detail ?? (await content.getContent({ type: resource.type, slug: resource.slug }));
      if (!body) return false;
      await cache.put(body);
      return true;
    } catch {
      // The bookmark stands; the caller learns the copy isn't offline yet. A
      // later online open of a saved item caches it (content.getDetail).
      return false;
    }
  }

  return {
    async toggle(resource, detail) {
      if (await repository.isSaved(resource.key)) {
        await repository.unsave(resource.key);
        // Best-effort: a stale cached body is harmless next to a failed unsave.
        await cache.remove(resource.key).catch(() => {});
        return { saved: false, offline: false };
      }
      await repository.save(resource);
      return { saved: true, offline: await keepOffline(resource, detail) };
    },
    list: () => repository.list(),
    isSaved: (resourceKey) => repository.isSaved(resourceKey),
  };
}
