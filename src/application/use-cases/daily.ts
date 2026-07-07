import type { ResourceRepository } from '@/application/ports/resource-repository';
import type { Resource } from '@/domain/resource';

export interface DailyUseCases {
  /**
   * The "Today" surface: one piece composed from the existing corpus, stable for a
   * given calendar day (same pick all day, new pick tomorrow).
   */
  getPick(date?: Date): Promise<Resource | null>;
}

/** How much of the recent feed the daily pick draws from. */
const POOL_SIZE = 40;

export function makeDailyUseCases(resources: ResourceRepository): DailyUseCases {
  return {
    async getPick(date = new Date()) {
      const page = await resources.getFeed({ page: 1, perPage: POOL_SIZE });
      // Readable/watchable pieces make the best daily card; skip event listings.
      const pool = page.items.filter((item) => item.type !== 'event');
      if (pool.length === 0) return null;
      return pool[dailyIndex(date, pool.length)];
    },
  };
}

/** Deterministic index for a calendar day — an FNV-1a hash of YYYY-MM-DD. */
export function dailyIndex(date: Date, poolSize: number): number {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash) % poolSize;
}
