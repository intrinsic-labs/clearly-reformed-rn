import type { ResourceRef } from '@/domain/resource-ref';

/**
 * A resolved, ready-to-play audio track. Resolution is source-dependent (sermons and
 * books carry a direct file URL; podcast episodes resolve through the RSS feed), so
 * the player only ever sees this normalized shape.
 */
export interface PlayableTrack {
  readonly resource: ResourceRef;
  readonly audioUrl: string;
  readonly durationSec: number | null;
  readonly artworkUrl: string | null;
  /** Lock-screen "artist" line — author/speaker. */
  readonly artist: string;
  /** Lock-screen "album" line — show name or content-type label. */
  readonly album: string;
}
