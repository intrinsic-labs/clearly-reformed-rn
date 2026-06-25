/**
 * Domain entities for Clearly Reformed content. Pure TypeScript — no framework,
 * network, or persistence concerns may be imported here (enforced by ESLint).
 */

/** The kinds of content the ministry publishes, normalized across API sources. */
export type ContentType =
  | 'article'
  | 'video'
  | 'podcast'
  | 'sermon'
  | 'sermon-clip'
  | 'lecture'
  | 'conference'
  | 'book'
  | 'event';

/**
 * A single piece of content as it appears in a feed/list (the magazine card) —
 * the app's internal vocabulary; adapters map each API shape onto it.
 *
 * Full body text and audio are intentionally NOT here: the unified feed
 * (`kdy/v1/all-resources`) is a feed index only. Body HTML and playable audio are
 * fetched on demand for the detail/Reader and audio slices via separate ports.
 */
export interface Resource {
  readonly id: number;
  readonly type: ContentType;
  readonly title: string;
  /** Routing key for the detail/Reader screen. */
  readonly slug: string;
  /** Short, plain-text summary suitable for a card. */
  readonly excerpt: string;
  /** Resolved featured image URL, or null when absent. */
  readonly imageUrl: string | null;
  /** Human display date as provided by the source, e.g. "June 23, 2026". */
  readonly displayDate: string;
  /** Author/speaker display names. */
  readonly people: readonly string[];
  /** Canonical URL on the website. */
  readonly link: string;
  /** Video URL (e.g. YouTube) when the item is/has a video; otherwise null. */
  readonly videoUrl: string | null;
  /** Scripture reference for sermons/teaching, when present (e.g. "Romans 3:1–2"). */
  readonly scriptureRef: string | null;
}
