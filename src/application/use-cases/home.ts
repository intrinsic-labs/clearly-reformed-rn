import type { NotebookRepository } from '@/application/ports/notebook-repository';
import type { ProgressRepository } from '@/application/ports/progress-repository';
import type { ResourceRepository } from '@/application/ports/resource-repository';
import type { SavedRepository } from '@/application/ports/saved-repository';
import { pickNewForYou, pickRecommendations, type TasteSignals } from '@/application/use-cases/home-ranking';
import type { Resource } from '@/domain/resource';
import type { ResourceRef } from '@/domain/resource-ref';

export interface HomeUseCases {
  /** Newest pieces the user hasn't opened or saved — "New for you". */
  getNewForYou(limit?: number, excludeKeys?: readonly string[]): Promise<readonly Resource[]>;
  /**
   * A light, taste-weighted backfill from the recent corpus — "Picked for you".
   * Empty until the user has saved or studied something.
   */
  getRecommendations(limit?: number, excludeKeys?: readonly string[]): Promise<readonly Resource[]>;
}

/** How deep into the feed the recommendation pool reaches (two pages). */
const POOL_PAGES = 2;
const POOL_PER_PAGE = 20;
const TOUCHED_LIMIT = 200;

export function makeHomeUseCases(
  resources: ResourceRepository,
  progress: ProgressRepository,
  saved: SavedRepository,
  notebook: NotebookRepository,
): HomeUseCases {
  async function seenKeys(extra: readonly string[]): Promise<Set<string>> {
    const [touched, savedItems] = await Promise.all([progress.listTouchedKeys(TOUCHED_LIMIT), saved.list()]);
    return new Set([...touched, ...savedItems.map((item) => item.resource.key), ...extra]);
  }

  async function tasteSignals(): Promise<TasteSignals> {
    const [savedItems, entries] = await Promise.all([saved.list(), notebook.list('all')]);
    const refs: ResourceRef[] = savedItems.map((item) => item.resource);
    for (const entry of entries) {
      if (entry.resource) refs.push(entry.resource);
    }
    return { refs };
  }

  async function pool(): Promise<Resource[]> {
    const pages = await Promise.all(
      Array.from({ length: POOL_PAGES }, (_, i) => resources.getFeed({ page: i + 1, perPage: POOL_PER_PAGE })),
    );
    return pages.flatMap((page) => page.items);
  }

  return {
    async getNewForYou(limit = 3, excludeKeys = []) {
      const [page, seen] = await Promise.all([resources.getFeed({ page: 1, perPage: POOL_PER_PAGE }), seenKeys(excludeKeys)]);
      return pickNewForYou(page.items, seen, limit);
    },

    async getRecommendations(limit = 4, excludeKeys = []) {
      const signals = await tasteSignals();
      if (signals.refs.length === 0) return [];
      const [candidates, seen] = await Promise.all([pool(), seenKeys(excludeKeys)]);
      return pickRecommendations(candidates, signals, seen, limit);
    },
  };
}
