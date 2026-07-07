import type { SavedItem, SavedRepository } from '@/application/ports/saved-repository';
import type { ResourceRef } from '@/domain/resource-ref';

export interface SavedUseCases {
  /** Flip the saved state; resolves to the new state. */
  toggle(resource: ResourceRef): Promise<boolean>;
  list(): Promise<readonly SavedItem[]>;
  isSaved(resourceKey: string): Promise<boolean>;
}

export function makeSavedUseCases(repository: SavedRepository): SavedUseCases {
  return {
    async toggle(resource) {
      if (await repository.isSaved(resource.key)) {
        await repository.unsave(resource.key);
        return false;
      }
      await repository.save(resource);
      return true;
    },
    list: () => repository.list(),
    isSaved: (resourceKey) => repository.isSaved(resourceKey),
  };
}
