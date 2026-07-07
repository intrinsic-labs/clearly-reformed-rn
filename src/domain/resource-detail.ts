import type { Resource } from '@/domain/resource';

/**
 * A single resource with its full body — what the detail/Reader screen needs.
 * Extends the feed `Resource` (card vocabulary) with the on-demand fields that the
 * unified feed omits: the body HTML and any playable media.
 *
 * `bodyHtml` is kept as raw HTML on purpose: the interim native detail screen parses
 * it into blocks for display, and the forthcoming WebView Reader renders it directly.
 */
export interface ResourceDetail extends Resource {
  /** Full article/transcript body as HTML (`content.rendered`). May be empty. */
  readonly bodyHtml: string;
  /** Playable audio URL when the source provides one inline; otherwise null. */
  readonly audioUrl: string | null;
  /** Original/canonical source URL when the piece is a cross-post; otherwise null. */
  readonly sourceUrl: string | null;
}
