import type { ContentCache } from '@/application/ports/content-cache';
import type { SearchRepository } from '@/application/ports/search-repository';
import type { Resource } from '@/domain/resource';
import type { ResourceDetail } from '@/domain/resource-detail';

export interface SearchUseCases {
  /** Keyword search across the full corpus (online). */
  remote(term: string): Promise<readonly Resource[]>;
  /** Search locally cached (saved) content — works offline. */
  saved(term: string): Promise<readonly ResourceDetail[]>;
}

export function makeSearchUseCases(repository: SearchRepository, cache: ContentCache): SearchUseCases {
  return {
    remote: (term) => (term.trim().length >= 2 ? repository.search(term.trim()) : Promise.resolve([])),
    saved: (term) => (term.trim().length >= 2 ? cache.search(term.trim()) : Promise.resolve([])),
  };
}
