import type {
  ClipEntry,
  HighlightEntry,
  NotebookEntry,
  NotebookEntryKind,
  NoteEntry,
} from '@/domain/notebook';
import type { ResourceRef } from '@/domain/resource-ref';

/** The Notebook tab's filter chips. */
export type NotebookFilter = 'all' | 'highlights' | 'clips' | 'notes';

export interface NotebookCounts {
  readonly highlights: number;
  readonly clips: number;
  readonly notes: number;
}

/** Inputs for new entries — the repository assigns id and timestamps. */
export interface NewHighlight {
  readonly resource: ResourceRef;
  readonly quote: string;
  readonly prefix: string | null;
  readonly suffix: string | null;
  readonly charOffset: number | null;
  readonly note: string | null;
}

export interface NewClip {
  readonly resource: ResourceRef;
  readonly mediaKind: 'audio' | 'video';
  readonly startSec: number;
  readonly endSec: number | null;
  readonly caption: string | null;
}

export interface NewNote {
  readonly resource: ResourceRef | null;
  readonly title: string | null;
  readonly body: string;
  readonly tags: readonly string[];
}

/**
 * The boundary the application depends on for the personal study layer. Implemented
 * over the local SQLite database in the data layer; rows are shaped for the future
 * last-write-wins sync (soft delete + pending flag) without a migration.
 */
export interface NotebookRepository {
  /** Newest-first feed of entries, optionally narrowed to one kind. */
  list(filter: NotebookFilter): Promise<readonly NotebookEntry[]>;
  counts(): Promise<NotebookCounts>;
  /** Full-text search over quotes, captions, notes, and titles (FTS5). */
  search(term: string): Promise<readonly NotebookEntry[]>;

  addHighlight(input: NewHighlight): Promise<HighlightEntry>;
  addClip(input: NewClip): Promise<ClipEntry>;
  addNote(input: NewNote): Promise<NoteEntry>;

  /** Attach/replace/remove the annotation on a highlight. */
  setHighlightNote(id: string, note: string | null): Promise<void>;
  updateNote(id: string, changes: { title: string | null; body: string; tags: readonly string[] }): Promise<void>;
  /** Soft-delete (kept locally as a tombstone for future sync). */
  remove(kind: NotebookEntryKind, id: string): Promise<void>;

  /** All live highlights for one resource — the Reader re-paints these on open. */
  highlightsFor(resourceKey: string): Promise<readonly HighlightEntry[]>;
}
