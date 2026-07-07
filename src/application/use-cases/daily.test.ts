import { describe, expect, it } from '@jest/globals';

import { dailyIndex } from '@/application/use-cases/daily';

describe('dailyIndex', () => {
  it('is deterministic for a given day', () => {
    const day = new Date('2026-07-07T09:00:00');
    const later = new Date('2026-07-07T23:59:00');
    expect(dailyIndex(day, 40)).toBe(dailyIndex(later, 40));
  });

  it('stays within the pool bounds', () => {
    for (let offset = 0; offset < 60; offset++) {
      const date = new Date(2026, 0, 1 + offset);
      const index = dailyIndex(date, 40);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(40);
    }
  });

  it('varies across days', () => {
    const indexes = new Set<number>();
    for (let offset = 0; offset < 14; offset++) {
      indexes.add(dailyIndex(new Date(2026, 6, 1 + offset), 40));
    }
    expect(indexes.size).toBeGreaterThan(5);
  });
});
