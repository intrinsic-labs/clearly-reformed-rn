import type { ResourceRef } from '@/domain/resource-ref';

/**
 * The cross-media Notebook — the personal study layer (project-info §4 Tier 2).
 * Three entry kinds share one feed:
 *
 *  - highlight — a passage of text selected in the Reader.
 *  - clip — a timestamped moment in audio or video ("Clip moment" in the player).
 *  - note — free-form writing, optionally linked to a resource, taggable.
 *
 * All entries are local-first. Timestamps are epoch milliseconds. Ids are UUIDs
 * assigned by the data layer so entries stay globally unique once sync arrives.
 */

export type NotebookEntryKind = 'highlight' | 'clip' | 'note';

interface NotebookEntryBase {
  readonly id: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface HighlightEntry extends NotebookEntryBase {
  readonly kind: 'highlight';
  readonly resource: ResourceRef;
  /** The selected text, exactly as highlighted. */
  readonly quote: string;
  /** Up to ~40 chars of text immediately before/after the quote — re-anchors the
   * highlight in the body when it renders again (text-quote anchoring). */
  readonly prefix: string | null;
  readonly suffix: string | null;
  /** Approximate character offset of the quote within the plain body text. */
  readonly charOffset: number | null;
  /** Optional annotation attached to the highlight. */
  readonly note: string | null;
}

export interface ClipEntry extends NotebookEntryBase {
  readonly kind: 'clip';
  readonly resource: ResourceRef;
  readonly mediaKind: 'audio' | 'video';
  readonly startSec: number;
  /** Null while the clip is a single moment rather than a range. */
  readonly endSec: number | null;
  /** Optional caption/quote the user attaches to the moment. */
  readonly caption: string | null;
}

export interface NoteEntry extends NotebookEntryBase {
  readonly kind: 'note';
  /** Linked content, or null for a standalone note. */
  readonly resource: ResourceRef | null;
  readonly title: string | null;
  readonly body: string;
  readonly tags: readonly string[];
}

export type NotebookEntry = HighlightEntry | ClipEntry | NoteEntry;
