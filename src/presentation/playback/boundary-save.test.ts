import { describe, expect, it } from '@jest/globals';

import { boundarySavePosition } from '@/presentation/playback/boundary-save';

describe('boundarySavePosition', () => {
  it('saves the live position when pausing after listening', () => {
    expect(boundarySavePosition({ kind: 'paused', playedSinceLoad: true, livePosition: 56.9, duration: 3463 })).toBe(56.9);
  });

  it('never overwrites the stored position for a restored track that has not played', () => {
    // Cold-launch restore: paused at load, player still reporting 0.
    expect(boundarySavePosition({ kind: 'paused', playedSinceLoad: false, livePosition: 0, duration: 3463 })).toBeNull();
  });

  it('marks the end as the full duration', () => {
    expect(boundarySavePosition({ kind: 'ended', playedSinceLoad: true, livePosition: 3460, duration: 3463 })).toBe(3463);
  });

  it('does nothing without a known duration', () => {
    expect(boundarySavePosition({ kind: 'paused', playedSinceLoad: true, livePosition: 12, duration: 0 })).toBeNull();
  });
});
