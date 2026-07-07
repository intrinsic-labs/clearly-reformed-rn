import type { PlayableTrack } from '@/domain/playable';
import type { ContinueItem, Progress, ProgressKind } from '@/domain/progress';
import type { ResourceRef } from '@/domain/resource-ref';

/** A raw position report from the player or Reader; derived fields are computed in the use case. */
export interface ProgressUpdate {
  readonly resource: ResourceRef;
  readonly kind: ProgressKind;
  readonly position: number;
  readonly length: number;
  /** For audio: the resolved track, embedded so playback can restore on cold launch. */
  readonly playable?: PlayableTrack | null;
}

/**
 * Persistence boundary for cross-content progress ("Continue"). One row per resource;
 * an update replaces the previous position. Playback rows keep the resolved track
 * alongside so the mini-player can restore the last session offline.
 */
export interface ProgressRepository {
  upsert(update: ProgressUpdate & { fraction: number; completed: boolean }): Promise<void>;
  get(resourceKey: string): Promise<Progress | null>;
  /** Unfinished items, most recent first — the Continue rail. */
  listContinue(limit: number): Promise<readonly ContinueItem[]>;
  /** The most recently touched audio session (finished or not) — mini-player restore. */
  latestListen(): Promise<ContinueItem | null>;
}
