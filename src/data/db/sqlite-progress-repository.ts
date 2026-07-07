import type { ProgressRepository, ProgressUpdate } from '@/application/ports/progress-repository';
import type { PlayableTrack } from '@/domain/playable';
import type { ContinueItem, Progress, ProgressKind } from '@/domain/progress';
import type { ResourceRef } from '@/domain/resource-ref';
import { getDatabase } from '@/data/db/database';

/**
 * Cross-content progress over SQLite — one row per resource, replaced on every
 * report. Audio rows keep the resolved track JSON so the mini-player can restore
 * the last session on a cold, offline launch.
 */
export function createSqliteProgressRepository(): ProgressRepository {
  return {
    async upsert(update: ProgressUpdate & { fraction: number; completed: boolean }): Promise<void> {
      const db = await getDatabase();
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO progress (resource_key, kind, resource_json, position, length, fraction, completed, playable_json, created_at, updated_at, deleted, pending)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
         ON CONFLICT(resource_key) DO UPDATE SET
           kind = excluded.kind,
           resource_json = excluded.resource_json,
           position = excluded.position,
           length = excluded.length,
           fraction = excluded.fraction,
           completed = excluded.completed,
           playable_json = COALESCE(excluded.playable_json, progress.playable_json),
           updated_at = excluded.updated_at,
           deleted = 0,
           pending = 1`,
        [
          update.resource.key,
          update.kind,
          JSON.stringify(update.resource),
          update.position,
          update.length,
          update.fraction,
          update.completed ? 1 : 0,
          update.playable ? JSON.stringify(update.playable) : null,
          now,
          now,
        ],
      );
    },

    async get(resourceKey: string): Promise<Progress | null> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<ProgressRow>(
        'SELECT * FROM progress WHERE resource_key = ? AND deleted = 0',
        [resourceKey],
      );
      return row ? mapProgress(row) : null;
    },

    async listContinue(limit: number): Promise<readonly ContinueItem[]> {
      const db = await getDatabase();
      // In-flight items only: skip finished pieces and barely-started noise.
      const rows = await db.getAllAsync<ProgressRow>(
        `SELECT * FROM progress
         WHERE deleted = 0 AND completed = 0 AND fraction >= 0.01
         ORDER BY updated_at DESC LIMIT ?`,
        [limit],
      );
      return rows.map((row) => ({ progress: mapProgress(row), playable: mapPlayable(row) }));
    },

    async latestListen(): Promise<ContinueItem | null> {
      const db = await getDatabase();
      const row = await db.getFirstAsync<ProgressRow>(
        `SELECT * FROM progress
         WHERE deleted = 0 AND kind = 'listen' AND playable_json IS NOT NULL
         ORDER BY updated_at DESC LIMIT 1`,
      );
      return row ? { progress: mapProgress(row), playable: mapPlayable(row) } : null;
    },
  };
}

interface ProgressRow {
  resource_key: string;
  kind: ProgressKind;
  resource_json: string;
  position: number;
  length: number;
  fraction: number;
  completed: number;
  playable_json: string | null;
  updated_at: number;
}

function mapProgress(row: ProgressRow): Progress {
  return {
    resource: JSON.parse(row.resource_json) as ResourceRef,
    kind: row.kind,
    position: row.position,
    length: row.length,
    fraction: row.fraction,
    completed: row.completed === 1,
    updatedAt: row.updated_at,
  };
}

function mapPlayable(row: ProgressRow): PlayableTrack | null {
  return row.playable_json ? (JSON.parse(row.playable_json) as PlayableTrack) : null;
}
