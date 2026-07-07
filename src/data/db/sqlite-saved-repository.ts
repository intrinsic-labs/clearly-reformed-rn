import type { SavedItem, SavedRepository } from '@/application/ports/saved-repository';
import type { ResourceRef } from '@/domain/resource-ref';
import { getDatabase } from '@/data/db/database';

/** Saved/bookmarked items over SQLite. Unsaving keeps a tombstone for future sync. */
export function createSqliteSavedRepository(): SavedRepository {
  return {
    async save(resource: ResourceRef): Promise<void> {
      const db = await getDatabase();
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO saved_items (resource_key, resource_json, created_at, updated_at, deleted, pending)
         VALUES (?, ?, ?, ?, 0, 1)
         ON CONFLICT(resource_key) DO UPDATE SET
           resource_json = excluded.resource_json,
           updated_at = excluded.updated_at,
           deleted = 0,
           pending = 1`,
        [resource.key, JSON.stringify(resource), now, now],
      );
    },

    async unsave(resourceKey: string): Promise<void> {
      const db = await getDatabase();
      await db.runAsync('UPDATE saved_items SET deleted = 1, updated_at = ?, pending = 1 WHERE resource_key = ?', [
        Date.now(),
        resourceKey,
      ]);
    },

    async list(): Promise<readonly SavedItem[]> {
      const db = await getDatabase();
      const rows = await db.getAllAsync<{ resource_json: string; updated_at: number }>(
        'SELECT resource_json, updated_at FROM saved_items WHERE deleted = 0 ORDER BY updated_at DESC',
      );
      return rows.map((row) => ({
        resource: JSON.parse(row.resource_json) as ResourceRef,
        savedAt: row.updated_at,
      }));
    },

    async isSaved(resourceKey: string): Promise<boolean> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{ n: number }>(
        'SELECT COUNT(*) AS n FROM saved_items WHERE resource_key = ? AND deleted = 0',
        [resourceKey],
      );
      return (row?.n ?? 0) > 0;
    },
  };
}
