/**
 * One episode of Life and Books and Everything as published in the podcast RSS feed —
 * the authoritative source for playable podcast audio (the WordPress records carry
 * episode metadata but no MP3). `episodeNumber` matches WordPress
 * `acf["podcast_episode_#"]`, which is how the two sources reconcile.
 */
export interface PodcastEpisode {
  readonly guid: string;
  readonly episodeNumber: number | null;
  readonly title: string;
  readonly audioUrl: string;
  readonly durationSec: number | null;
  /** Display date derived from the RSS pubDate, e.g. "Jun 9, 2026". */
  readonly publishedAt: string;
  readonly artworkUrl: string | null;
  readonly descriptionHtml: string;
}
