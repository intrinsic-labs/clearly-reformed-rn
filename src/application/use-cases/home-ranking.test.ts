import { describe, expect, it } from '@jest/globals';

import type { Resource } from '@/domain/resource';
import type { ResourceRef } from '@/domain/resource-ref';
import { buildTasteProfile, pickNewForYou, pickRecommendations } from '@/application/use-cases/home-ranking';

function resource(id: number, type: Resource['type'], person = ''): Resource {
  return {
    id,
    type,
    title: `Item ${id}`,
    slug: `item-${id}`,
    excerpt: '',
    imageUrl: null,
    thumbnailUrl: null,
    displayDate: 'June 1, 2026',
    people: person ? [person] : [],
    link: '',
    videoUrl: null,
    scriptureRef: null,
  };
}

function ref(id: number, type: ResourceRef['type'], subtitle = ''): ResourceRef {
  return { key: `${type}:${id}`, id, type, slug: `item-${id}`, title: `Item ${id}`, thumbnailUrl: null, subtitle, link: '' };
}

describe('buildTasteProfile', () => {
  it('counts types and lower-cased people from the signals', () => {
    const profile = buildTasteProfile({ refs: [ref(1, 'podcast', 'Kevin DeYoung'), ref(2, 'podcast'), ref(3, 'article', 'kevin deyoung')] });
    expect(profile.types.get('podcast')).toBe(2);
    expect(profile.types.get('article')).toBe(1);
    expect(profile.people.get('kevin deyoung')).toBe(2);
  });
});

describe('pickNewForYou', () => {
  it('returns the newest unseen non-event items in feed order, up to the limit', () => {
    const feed = [resource(1, 'article'), resource(2, 'event'), resource(3, 'podcast'), resource(4, 'video'), resource(5, 'sermon')];
    const seen = new Set(['article:1']);
    expect(pickNewForYou(feed, seen, 2).map((r) => r.id)).toEqual([3, 4]);
  });
});

describe('pickRecommendations', () => {
  const pool = [
    resource(10, 'article', 'Kevin DeYoung'),
    resource(11, 'podcast', 'Kevin DeYoung'),
    resource(12, 'podcast'),
    resource(13, 'podcast'),
    resource(14, 'video', 'Someone Else'),
    resource(15, 'lecture'),
  ];

  it('renders nothing without any signals', () => {
    expect(pickRecommendations(pool, { refs: [] }, new Set(), 4)).toEqual([]);
  });

  it('prefers a matching person over a matching type, skips seen items, and caps per type', () => {
    const signals = { refs: [ref(1, 'podcast', 'Kevin DeYoung'), ref(2, 'podcast')] };
    const picks = pickRecommendations(pool, signals, new Set(['podcast:11']), 4);
    const ids = picks.map((r) => r.id);
    // 10 matches the person (article, weight 2.5); 12/13 match the type; 11 is seen.
    expect(ids[0]).toBe(10);
    expect(ids).toContain(12);
    expect(ids).toContain(13);
    expect(ids).not.toContain(11);
    expect(ids.filter((id) => [12, 13].includes(id)).length).toBeLessThanOrEqual(2);
    // No affinity for video/lecture → excluded rather than padded in.
    expect(ids).not.toContain(14);
    expect(ids).not.toContain(15);
  });
});
