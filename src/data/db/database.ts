import * as SQLite from 'expo-sqlite';

/**
 * The single on-device database (SPEC §3): notebook + saved content + progress +
 * content cache + FTS5, consolidated in one battle-tested store.
 *
 * Synced-table row conventions (designed ahead for the v1.1 last-write-wins sync,
 * so turning sync on needs no migration):
 *  - `id`/`resource_key` — stable primary key (UUID or namespaced resource key).
 *  - `created_at` / `updated_at` — epoch ms, set locally.
 *  - `deleted` — soft-delete tombstone (rows are never hard-deleted locally).
 *  - `pending` — 1 while the row has local changes not yet pushed.
 *
 * Opened lazily once per process; every repository awaits the same handle.
 */

const DATABASE_NAME = 'clearly-reformed.db';
const SCHEMA_VERSION = 1;

let handle: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!handle) handle = open();
  return handle;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  if (current < 1) {
    await db.execAsync(SCHEMA_V1);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY,
  resource_key TEXT NOT NULL,
  resource_json TEXT NOT NULL,
  quote TEXT NOT NULL,
  prefix TEXT,
  suffix TEXT,
  char_offset INTEGER,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_highlights_resource ON highlights(resource_key);

CREATE TABLE IF NOT EXISTS clips (
  id TEXT PRIMARY KEY,
  resource_key TEXT NOT NULL,
  resource_json TEXT NOT NULL,
  media_kind TEXT NOT NULL,
  start_sec REAL NOT NULL,
  end_sec REAL,
  caption TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  resource_key TEXT,
  resource_json TEXT,
  title TEXT,
  body TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS saved_items (
  resource_key TEXT PRIMARY KEY,
  resource_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS progress (
  resource_key TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  resource_json TEXT NOT NULL,
  position REAL NOT NULL,
  length REAL NOT NULL,
  fraction REAL NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  playable_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 1
);

-- Device-local only (not part of the future sync).
CREATE TABLE IF NOT EXISTS content_cache (
  resource_key TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  cached_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_cache_slug ON content_cache(type, slug);

CREATE TABLE IF NOT EXISTS downloads (
  resource_key TEXT PRIMARY KEY,
  resource_json TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  status TEXT NOT NULL,
  bytes_total INTEGER,
  bytes_done INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Offline keyword search (SPEC §7): notebook text and cached content bodies.
CREATE VIRTUAL TABLE IF NOT EXISTS notebook_fts USING fts5(text, entry_id UNINDEXED, kind UNINDEXED);
CREATE VIRTUAL TABLE IF NOT EXISTS content_fts USING fts5(title, body, resource_key UNINDEXED);
`;
