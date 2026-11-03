/**
 * When a playback boundary (pause, end) should overwrite the stored listening
 * position, and with what. Pure so the rule is testable without a player.
 *
 * The trap this guards against: a cold-launch restore loads the last episode
 * *paused* at its saved position. That load emits paused/ready state changes
 * before anyone has listened, and at that moment the player (or a polled hook)
 * can still report 0. Saving then would erase the real position, drop the
 * episode out of Continue and make the next launch restore from the start.
 * So a pause only counts once the loaded track has actually played.
 */
export type BoundaryKind = 'paused' | 'ended';

export interface BoundaryInput {
  readonly kind: BoundaryKind;
  /** Has the active track been in the playing state since it was loaded? */
  readonly playedSinceLoad: boolean;
  /** The player's own position at the boundary, read live (seconds). */
  readonly livePosition: number;
  /** Seconds; 0 when unknown. */
  readonly duration: number;
}

/** Position to persist, or null to leave the stored row alone. */
export function boundarySavePosition({ kind, playedSinceLoad, livePosition, duration }: BoundaryInput): number | null {
  if (!(duration > 0)) return null;
  if (kind === 'ended') return duration;
  if (!playedSinceLoad) return null;
  return livePosition >= 0 ? livePosition : null;
}
