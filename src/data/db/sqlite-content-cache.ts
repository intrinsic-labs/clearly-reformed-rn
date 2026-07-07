import type { ContentCache } from '@/application/ports/content-cache';
import type { ContentType } from '@/domain/resource';
import type { ResourceDetail } from '@/domain/resource-detail';
import { resourceKey } from '@/domain/resource-ref';
import { getDatabase } from '@/data/db/database';
import { ftsQuery } from '@/data/db/fts';

/**
 * Offline body cache over SQLite. Bodies are stored as the full ResourceDetail JSON
 * (title, meta, and HTML together) so an offline read renders identically to an
 * online one. A plain-text extraction feeds the FTS5 index for offline search.
 */
export function createSqliteContentCache(): ContentCache {
  return {
    async put(detail: ResourceDetail): Promise<void> {
      const db = await getDatabase();
      const key = resourceKey(detail.type, detail.id);
      await db.runAsync(
        `INSERT INTO content_cache (resource_key, type, slug, detail_json, cached_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(resource_key) DO UPDATE SET
           type = excluded.type,
           slug = excluded.slug,
           detail_json = excluded.detail_json,
           cached_at = excluded.cached_at`,
        [key, detail.type, detail.slug, JSON.stringify(detail), Date.now()],
      );
      await db.runAsync('DELETE FROM content_fts WHERE resource_key = ?', [key]);
      await db.runAsync('INSERT INTO content_fts (title, body, resource_key) VALUES (?, ?, ?)', [
        detail.title,
        plainText(detail.bodyHtml),
        key,
      ]);
    },

    async get(type: ContentType, slug: string): Promise<ResourceDetail | null> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{ detail_json: string }>(
        'SELECT detail_json FROM content_cache WHERE type = ? AND slug = ?',
        [type, slug],
      );
      return row ? (JSON.parse(row.detail_json) as ResourceDetail) : null;
    },

    async remove(key: string): Promise<void> {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM content_cache WHERE resource_key = ?', [key]);
      await db.runAsync('DELETE FROM content_fts WHERE resource_key = ?', [key]);
    },

    async search(term: string): Promise<readonly ResourceDetail[]> {
      const db = await getDatabase();
      const hits = await db.getAllAsync<{ resource_key: string }>(
        'SELECT resource_key FROM content_fts WHERE content_fts MATCH ? ORDER BY rank LIMIT 30',
        [ftsQuery(term)],
      );
      if (hits.length === 0) return [];
      const placeholders = hits.map(() => '?').join(',');
      const rows = await db.getAllAsync<{ resource_key: string; detail_json: string }>(
        `SELECT resource_key, detail_json FROM content_cache WHERE resource_key IN (${placeholders})`,
        hits.map((h) => h.resource_key),
      );
      const byKey = new Map(rows.map((row) => [row.resource_key, JSON.parse(row.detail_json) as ResourceDetail]));
      return hits.map((h) => byKey.get(h.resource_key)).filter((d): d is ResourceDetail => Boolean(d));
    },
  };
}

/** Collapse HTML to searchable plain text. */
function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[#\w]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
