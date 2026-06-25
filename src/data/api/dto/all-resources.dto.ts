/**
 * Raw shape of an item from `kdy/v1/all-resources`, as confirmed by the live probe.
 * Only the fields we consume are typed; the endpoint returns more.
 */
export interface AllResourcesItemDto {
  readonly id: number;
  readonly title: { readonly rendered: string };
  readonly slug: string;
  /** WordPress post type, e.g. "post", "sermon", "podcast_episode", "explainer-video". */
  readonly type: string;
  readonly subtype?: string;
  /** Human display date, e.g. "June 23, 2026". */
  readonly date: string;
  readonly link: string;
  readonly excerpt: string;
  readonly featured_image_url: string | null;
  /** Present on the unified feed; carries resized variants (notably `medium`, ~300px). */
  readonly better_featured_image?: {
    readonly media_details?: {
      readonly sizes?: Record<string, { readonly source_url?: string } | undefined>;
    };
  } | null;
  readonly people_display?: readonly string[];
  /** Video URL (YouTube) when present; sparse across the feed. */
  readonly videoEmbed?: string | null;
  readonly acf?: { readonly scriptureReference?: string } | null;
}
