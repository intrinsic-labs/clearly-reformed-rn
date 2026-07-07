import * as Crypto from 'expo-crypto';

import type {
  NewClip,
  NewHighlight,
  NewNote,
  NotebookCounts,
  NotebookFilter,
  NotebookRepository,
} from '@/application/ports/notebook-repository';
import type {
  ClipEntry,
  HighlightEntry,
  NotebookEntry,
  NotebookEntryKind,
  NoteEntry,
} from '@/domain/notebook';
import type { ResourceRef } from '@/domain/resource-ref';
import { getDatabase } from '@/data/db/database';

/**
 * Notebook over the local SQLite store. Each kind has its own table; the feed is a
 * three-way union ordered by recency. Every write also maintains the FTS5 mirror
 * (`notebook_fts`) so offline search stays in step — explicit upserts rather than
 * triggers, so the indexed text stays an implementation detail of this module.
 */
export function createSqliteNotebookRepository(): NotebookRepository {
  return {
    async list(filter: NotebookFilter): Promise<readonly NotebookEntry[]> {
      const db = await getDatabase();
      const entries: NotebookEntry[] = [];

      if (filter === 'all' || filter === 'highlights') {
        const rows = await db.getAllAsync<HighlightRow>('SELECT * FROM highlights WHERE deleted = 0');
        entries.push(...rows.map(mapHighlight));
      }
      if (filter === 'all' || filter === 'clips') {
        const rows = await db.getAllAsync<ClipRow>('SELECT * FROM clips WHERE deleted = 0');
        entries.push(...rows.map(mapClip));
      }
      if (filter === 'all' || filter === 'notes') {
        const rows = await db.getAllAsync<NoteRow>('SELECT * FROM notes WHERE deleted = 0');
        entries.push(...rows.map(mapNote));
      }

      return entries.sort((a, b) => b.createdAt - a.createdAt);
    },

    async counts(): Promise<NotebookCounts> {
      const db = await getDatabase();
      const [h, c, n] = await Promise.all([
        db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM highlights WHERE deleted = 0'),
        db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM clips WHERE deleted = 0'),
        db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM notes WHERE deleted = 0'),
      ]);
      return { highlights: h?.n ?? 0, clips: c?.n ?? 0, notes: n?.n ?? 0 };
    },

    async search(term: string): Promise<readonly NotebookEntry[]> {
      const db = await getDatabase();
      const hits = await db.getAllAsync<{ entry_id: string; kind: NotebookEntryKind }>(
        'SELECT entry_id, kind FROM notebook_fts WHERE notebook_fts MATCH ? ORDER BY rank LIMIT 50',
        [ftsQuery(term)],
      );
      if (hits.length === 0) return [];

      const byKind: Record<NotebookEntryKind, string[]> = { highlight: [], clip: [], note: [] };
      for (const hit of hits) byKind[hit.kind]?.push(hit.entry_id);

      const entries = new Map<string, NotebookEntry>();
      const load = async <Row>(table: string, ids: string[], map: (row: Row) => NotebookEntry) => {
        if (ids.length === 0) return;
        const placeholders = ids.map(() => '?').join(',');
        const rows = await db.getAllAsync<Row>(
          `SELECT * FROM ${table} WHERE deleted = 0 AND id IN (${placeholders})`,
          ids,
        );
        for (const row of rows) {
          const entry = map(row);
          entries.set(entry.id, entry);
        }
      };
      await load<HighlightRow>('highlights', byKind.highlight, mapHighlight);
      await load<ClipRow>('clips', byKind.clip, mapClip);
      await load<NoteRow>('notes', byKind.note, mapNote);

      // Preserve FTS relevance order.
      return hits.map((hit) => entries.get(hit.entry_id)).filter((e): e is NotebookEntry => Boolean(e));
    },

    async addHighlight(input: NewHighlight): Promise<HighlightEntry> {
      const db = await getDatabase();
      const id = Crypto.randomUUID();
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO highlights (id, resource_key, resource_json, quote, prefix, suffix, char_offset, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.resource.key,
          JSON.stringify(input.resource),
          input.quote,
          input.prefix,
          input.suffix,
          input.charOffset,
          input.note,
          now,
          now,
        ],
      );
      await indexText(id, 'highlight', [input.quote, input.note]);
      return { kind: 'highlight', id, createdAt: now, updatedAt: now, ...input };
    },

    async addClip(input: NewClip): Promise<ClipEntry> {
      const db = await getDatabase();
      const id = Crypto.randomUUID();
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO clips (id, resource_key, resource_json, media_kind, start_sec, end_sec, caption, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.resource.key,
          JSON.stringify(input.resource),
          input.mediaKind,
          input.startSec,
          input.endSec,
          input.caption,
          now,
          now,
        ],
      );
      await indexText(id, 'clip', [input.caption, input.resource.title]);
      return { kind: 'clip', id, createdAt: now, updatedAt: now, ...input };
    },

    async addNote(input: NewNote): Promise<NoteEntry> {
      const db = await getDatabase();
      const id = Crypto.randomUUID();
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO notes (id, resource_key, resource_json, title, body, tags_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.resource?.key ?? null,
          input.resource ? JSON.stringify(input.resource) : null,
          input.title,
          input.body,
          JSON.stringify(input.tags),
          now,
          now,
        ],
      );
      await indexText(id, 'note', [input.title, input.body, input.tags.join(' ')]);
      return { kind: 'note', id, createdAt: now, updatedAt: now, ...input };
    },

    async setHighlightNote(id: string, note: string | null): Promise<void> {
      const db = await getDatabase();
      await db.runAsync('UPDATE highlights SET note = ?, updated_at = ?, pending = 1 WHERE id = ?', [
        note,
        Date.now(),
        id,
      ]);
      const row = await db.getFirstAsync<HighlightRow>('SELECT * FROM highlights WHERE id = ?', [id]);
      if (row) await indexText(id, 'highlight', [row.quote, note]);
    },

    async updateNote(id, changes): Promise<void> {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE notes SET title = ?, body = ?, tags_json = ?, updated_at = ?, pending = 1 WHERE id = ?',
        [changes.title, changes.body, JSON.stringify(changes.tags), Date.now(), id],
      );
      await indexText(id, 'note', [changes.title, changes.body, changes.tags.join(' ')]);
    },

    async remove(kind: NotebookEntryKind, id: string): Promise<void> {
      const db = await getDatabase();
      const table = TABLE_BY_KIND[kind];
      await db.runAsync(`UPDATE ${table} SET deleted = 1, updated_at = ?, pending = 1 WHERE id = ?`, [
        Date.now(),
        id,
      ]);
      await db.runAsync('DELETE FROM notebook_fts WHERE entry_id = ?', [id]);
    },

    async highlightsFor(resourceKey: string): Promise<readonly HighlightEntry[]> {
      const db = await getDatabase();
      const rows = await db.getAllAsync<HighlightRow>(
        'SELECT * FROM highlights WHERE resource_key = ? AND deleted = 0 ORDER BY created_at ASC',
        [resourceKey],
      );
      return rows.map(mapHighlight);
    },
  };
}

const TABLE_BY_KIND: Record<NotebookEntryKind, string> = {
  highlight: 'highlights',
  clip: 'clips',
  note: 'notes',
};

/** Replace an entry's searchable text in the FTS mirror. */
async function indexText(
  entryId: string,
  kind: NotebookEntryKind,
  parts: readonly (string | null | undefined)[],
): Promise<void> {
  const db = await getDatabase();
  const text = parts.filter(Boolean).join('\n');
  await db.runAsync('DELETE FROM notebook_fts WHERE entry_id = ?', [entryId]);
  if (text) {
    await db.runAsync('INSERT INTO notebook_fts (text, entry_id, kind) VALUES (?, ?, ?)', [text, entryId, kind]);
  }
}

/** Quote each term so user input can't hit FTS5 query syntax; prefix-match the last term. */
export function ftsQuery(term: string): string {
  const words = term.split(/\s+/).filter(Boolean).map((w) => `"${w.replace(/"/g, '')}"`);
  if (words.length === 0) return '""';
  words[words.length - 1] += '*';
  return words.join(' ');
}

interface HighlightRow {
  id: string;
  resource_json: string;
  quote: string;
  prefix: string | null;
  suffix: string | null;
  char_offset: number | null;
  note: string | null;
  created_at: number;
  updated_at: number;
}

interface ClipRow {
  id: string;
  resource_json: string;
  media_kind: 'audio' | 'video';
  start_sec: number;
  end_sec: number | null;
  caption: string | null;
  created_at: number;
  updated_at: number;
}

interface NoteRow {
  id: string;
  resource_json: string | null;
  title: string | null;
  body: string;
  tags_json: string;
  created_at: number;
  updated_at: number;
}

function mapHighlight(row: HighlightRow): HighlightEntry {
  return {
    kind: 'highlight',
    id: row.id,
    resource: JSON.parse(row.resource_json) as ResourceRef,
    quote: row.quote,
    prefix: row.prefix,
    suffix: row.suffix,
    charOffset: row.char_offset,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapClip(row: ClipRow): ClipEntry {
  return {
    kind: 'clip',
    id: row.id,
    resource: JSON.parse(row.resource_json) as ResourceRef,
    mediaKind: row.media_kind,
    startSec: row.start_sec,
    endSec: row.end_sec,
    caption: row.caption,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNote(row: NoteRow): NoteEntry {
  return {
    kind: 'note',
    id: row.id,
    resource: row.resource_json ? (JSON.parse(row.resource_json) as ResourceRef) : null,
    title: row.title,
    body: row.body,
    tags: JSON.parse(row.tags_json) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
