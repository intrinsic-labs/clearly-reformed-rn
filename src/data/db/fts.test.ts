import { describe, expect, it } from '@jest/globals';

import { ftsQuery } from '@/data/db/fts';

describe('ftsQuery', () => {
  it('quotes terms and prefix-matches the last one', () => {
    expect(ftsQuery('divine sovereignty')).toBe('"divine" "sovereignty"*');
  });

  it('neutralizes FTS5 operators and quotes', () => {
    expect(ftsQuery('prayer OR "hack')).toBe('"prayer" "OR" "hack"*');
  });

  it('handles empty input', () => {
    expect(ftsQuery('   ')).toBe('""');
  });
});
