import type { ProgressRepository, ProgressUpdate } from '@/application/ports/progress-repository';
import type { ContinueItem, Progress } from '@/domain/progress';
import { progressFields } from '@/domain/progress';

export interface ProgressUseCases {
  /** Record a position report from the player or Reader. */
  save(update: ProgressUpdate): Promise<void>;
  get(resourceKey: string): Promise<Progress | null>;
  /** The cross-content Continue rail. */
  listContinue(limit?: number): Promise<readonly ContinueItem[]>;
  /** Most recent audio session — restores the mini-player on cold launch. */
  latestListen(): Promise<ContinueItem | null>;
}

export function makeProgressUseCases(repository: ProgressRepository): ProgressUseCases {
  return {
    async save(update) {
      // Positions from a not-yet-loaded player arrive as 0/0 — never overwrite a
      // real position with those.
      if (!(update.length > 0) || update.position < 0) return;
      await repository.upsert({ ...update, ...progressFields(update.position, update.length) });
    },
    get: (resourceKey) => repository.get(resourceKey),
    listContinue: (limit = 10) => repository.listContinue(limit),
    latestListen: () => repository.latestListen(),
  };
}
