import { describe, expect, it } from '@jest/globals';

import type { ContentCache } from '@/application/ports/content-cache';
import type { ResourceContentRepository } from '@/application/ports/resource-content-repository';
import type { SavedRepository } from '@/application/ports/saved-repository';
import { makeSavedUseCases } from '@/application/use-cases/saved';
import type { ResourceDetail } from '@/domain/resource-detail';
import { toResourceRef } from '@/domain/resource-ref';

const detail: ResourceDetail = {
  id: 7,
  type: 'article',
  title: 'Reflections',
  slug: 'reflections',
  excerpt: '',
  imageUrl: null,
  thumbnailUrl: null,
  displayDate: '',
  people: ['Kevin DeYoung'],
  link: 'https://example.org/reflections',
  videoUrl: null,
  scriptureRef: null,
  bodyHtml: '<p>Body</p>',
  audioUrl: null,
  sourceUrl: null,
  episodeNumber: null,
};
const resource = toResourceRef(detail);

function harness({ fetchFails = false, putFails = false } = {}) {
  const saved = new Set<string>();
  const cached = new Map<string, ResourceDetail>();
  let fetches = 0;
  const repository: SavedRepository = {
    save: async (r) => void saved.add(r.key),
    unsave: async (key) => void saved.delete(key),
    list: async () => [],
    isSaved: async (key) => saved.has(key),
  };
  const cache: ContentCache = {
    put: async (d) => {
      if (putFails) throw new Error('disk full');
      cached.set(`${d.type}:${d.id}`, d);
    },
    get: async () => null,
    remove: async (key) => void cached.delete(key),
    search: async () => [],
  };
  const content: ResourceContentRepository = {
    getContent: async () => {
      fetches += 1;
      if (fetchFails) throw new Error('offline');
      return detail;
    },
  };
  return { useCases: makeSavedUseCases(repository, cache, content), saved, cached, fetches: () => fetches };
}

describe('saved toggle', () => {
  it('caches the open body on save without fetching', async () => {
    const h = harness();
    await expect(h.useCases.toggle(resource, detail)).resolves.toEqual({ saved: true, offline: true });
    expect(h.cached.has(resource.key)).toBe(true);
    expect(h.fetches()).toBe(0);
  });

  it('fetches the body when saving from somewhere it is not open', async () => {
    const h = harness();
    await expect(h.useCases.toggle(resource)).resolves.toEqual({ saved: true, offline: true });
    expect(h.fetches()).toBe(1);
  });

  it('keeps the bookmark but reports no offline copy when caching fails', async () => {
    const put = harness({ putFails: true });
    await expect(put.useCases.toggle(resource, detail)).resolves.toEqual({ saved: true, offline: false });
    expect(put.saved.has(resource.key)).toBe(true);

    const fetch = harness({ fetchFails: true });
    await expect(fetch.useCases.toggle(resource)).resolves.toEqual({ saved: true, offline: false });
  });

  it('lets an unsave that lands mid-fetch win', async () => {
    const h = harness();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    const slow = makeSavedUseCases(
      { save: async (r) => void h.saved.add(r.key), unsave: async (k) => void h.saved.delete(k), list: async () => [], isSaved: async (k) => h.saved.has(k) },
      { put: async (d) => void h.cached.set(`${d.type}:${d.id}`, d), get: async () => null, remove: async (k) => void h.cached.delete(k), search: async () => [] },
      { getContent: async () => { await gate; return detail; } },
    );
    const saving = slow.toggle(resource);
    await new Promise((r) => setTimeout(r, 0));
    await expect(slow.toggle(resource)).resolves.toEqual({ saved: false, offline: false });
    release();
    await expect(saving).resolves.toEqual({ saved: false, offline: false });
    expect(h.cached.has(resource.key)).toBe(false);
  });

  it('evicts the cached body on unsave', async () => {
    const h = harness();
    await h.useCases.toggle(resource, detail);
    await expect(h.useCases.toggle(resource, detail)).resolves.toEqual({ saved: false, offline: false });
    expect(h.cached.has(resource.key)).toBe(false);
  });
});
