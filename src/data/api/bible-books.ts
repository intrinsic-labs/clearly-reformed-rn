import { getList } from '@/data/api/http-client';

/**
 * The `bible_book` taxonomy (≤66 terms). WordPress stores only term ids on posts,
 * and `acf.scriptureReference` omits the book ("3:1–2") — this map supplies the
 * book names. Fetched once per session; a failure resolves empty so scripture
 * lines degrade to the bare reference instead of breaking detail loads.
 */
let cache: Promise<Map<number, string>> | null = null;

export function getBibleBookNames(): Promise<Map<number, string>> {
  if (!cache) {
    cache = fetchAll().catch(() => {
      cache = null; // Allow a retry on the next detail load.
      return new Map<number, string>();
    });
  }
  return cache;
}

async function fetchAll(): Promise<Map<number, string>> {
  const { data } = await getList<{ id: number; name: string }[]>('/wp/v2/bible_book', {
    per_page: 100,
    _fields: 'id,name',
  });
  return new Map(data.map((term) => [term.id, term.name]));
}
