import { describe, expect, it } from '@jest/globals';

import { mapSearchResult } from '@/data/api/wordpress-search-repository';

describe('mapSearchResult', () => {
  it('maps a kdy-enriched search hit onto the Resource card shape', () => {
    const resource = mapSearchResult({
      id: 35385,
      title: 'Wrestling in Prayer',
      url: 'https://control.kdy.org/sermon/wrestling-in-prayer/',
      subtype: 'sermon',
      featured_image_url: 'https://control.kdy.org/x.jpg',
      excerpt: 'On persistence.',
      date: 'August 8, 2022',
    });
    expect(resource).toMatchObject({
      id: 35385,
      type: 'sermon',
      slug: 'wrestling-in-prayer',
      title: 'Wrestling in Prayer',
      imageUrl: 'https://control.kdy.org/x.jpg',
      displayDate: 'August 8, 2022',
    });
  });

  it('decodes entities and recovers the slug from URLs with query strings', () => {
    const resource = mapSearchResult({
      id: 1,
      title: 'The Lord&#8217;s Prayer',
      url: 'https://control.kdy.org/the-lords-prayer/?utm=1',
      subtype: 'post',
    });
    expect(resource?.title).toBe('The Lord’s Prayer');
    expect(resource?.slug).toBe('the-lords-prayer');
    expect(resource?.type).toBe('article');
  });

  it('returns null when no slug is recoverable', () => {
    expect(mapSearchResult({ id: 1, title: 'X', url: 'https://control.kdy.org', subtype: 'post' })).not.toBeNull();
    expect(mapSearchResult({ id: 1, title: 'X', url: '', subtype: 'post' })).toBeNull();
  });
});
