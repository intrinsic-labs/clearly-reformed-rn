import type { PodcastEpisode } from '@/domain/podcast-episode';

/**
 * The podcast RSS feed boundary — the authoritative source of playable episode audio
 * (Life and Books and Everything publishes MP3s only through RSS, not WordPress).
 */
export interface PodcastRepository {
  /** All episodes, newest first. */
  getEpisodes(): Promise<readonly PodcastEpisode[]>;
}
