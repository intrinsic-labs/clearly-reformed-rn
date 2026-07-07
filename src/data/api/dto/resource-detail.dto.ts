/**
 * Raw shape of a single item from a per-type `wp/v2/{type}?slug=` request, as
 * confirmed by the live probe. Only the fields we consume are typed; the endpoint
 * returns far more (yoast, class_list, etc.).
 *
 * `acf` varies by type — the video URL is `video_embed` on most types but `video`
 * on sermons; audio is occasionally inline (`audioFile`/`podcast_mp3`) but usually
 * sourced elsewhere (RSS) — so every acf field is optional.
 */
export interface ResourceDetailDto {
  readonly id: number;
  readonly title: { readonly rendered: string };
  readonly slug: string;
  /** WordPress post type, e.g. "post", "sermon", "podcast_episode". */
  readonly type: string;
  /** Human display date, e.g. "June 23, 2026". */
  readonly date: string;
  readonly link: string;
  /** Plain-text excerpt (kdy plugin normalizes this to a string). */
  readonly excerpt?: string;
  /** Full body HTML. */
  readonly content?: { readonly rendered?: string };
  readonly featured_image_url: string | null;
  readonly people_display?: readonly string[];
  readonly acf?: {
    readonly audioFile?: string;
    readonly podcast_mp3?: string;
    /** Podcast episode number — matches the RSS feed's `itunes:episode`. */
    readonly 'podcast_episode_#'?: number | string;
    readonly video_embed?: string;
    /** Sermons carry the video URL here instead of `video_embed`. */
    readonly video?: string;
    readonly source_url?: string;
    readonly scriptureReference?: string;
  } | null;
}
