import type { PlayableTrack } from '@/domain/playable';
import type { ResourceRef } from '@/domain/resource-ref';

/**
 * Cross-content "Continue" — one progress record per resource, whatever the medium.
 * Position semantics vary by kind:
 *
 *  - listen / watch — `position`/`length` are seconds.
 *  - read — `position` is a character offset into the plain body text and `length`
 *    the total character count, so the position survives font-size/margin/screen
 *    changes (SPEC §8).
 */

export type ProgressKind = 'listen' | 'watch' | 'read';

export interface Progress {
  readonly resource: ResourceRef;
  readonly kind: ProgressKind;
  readonly position: number;
  readonly length: number;
  /** 0..1, derived from position/length at write time (for progress bars). */
  readonly fraction: number;
  /** True once the user effectively finished; completed items leave "Continue". */
  readonly completed: boolean;
  readonly updatedAt: number;
}

/**
 * A "Continue" row: the progress plus, for audio, the resolved track — embedded so
 * the mini-player can restore the last session on cold launch without a refetch.
 */
export interface ContinueItem {
  readonly progress: Progress;
  readonly playable: PlayableTrack | null;
}

/** Fraction beyond which an item counts as finished (and drops out of Continue). */
export const COMPLETED_FRACTION = 0.97;

/** Compute the derived progress fields from a raw position update. */
export function progressFields(position: number, length: number): { fraction: number; completed: boolean } {
  const fraction = length > 0 ? Math.min(1, Math.max(0, position / length)) : 0;
  return { fraction, completed: fraction >= COMPLETED_FRACTION };
}
