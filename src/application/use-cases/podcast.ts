import type { PodcastRepository } from '@/application/ports/podcast-repository';
import type { PlayableTrack } from '@/domain/playable';
import type { PodcastEpisode } from '@/domain/podcast-episode';
import type { ResourceDetail } from '@/domain/resource-detail';
import { toResourceRef } from '@/domain/resource-ref';

/** The show name, used for lock-screen metadata and player headers. */
export const PODCAST_SHOW_TITLE = 'Life and Books and Everything';

export interface PodcastUseCases {
  getEpisodes(): Promise<readonly PodcastEpisode[]>;
  /**
   * Resolve the playable audio for a resource, or null when it has none. Sermons,
   * books, and lectures carry a direct file URL; podcast episodes resolve through
   * the RSS feed — matched by episode number (authoritative) or normalized title.
   */
  resolveTrack(detail: ResourceDetail): Promise<PlayableTrack | null>;
}

export function makePodcastUseCases(repository: PodcastRepository): PodcastUseCases {
  return {
    getEpisodes: () => repository.getEpisodes(),

    async resolveTrack(detail) {
      const resource = toResourceRef(detail);
      const artist = detail.people[0] ?? 'Kevin DeYoung';

      if (detail.audioUrl) {
        return {
          resource,
          audioUrl: detail.audioUrl,
          durationSec: null,
          artworkUrl: detail.imageUrl,
          artist,
          album: 'Clearly Reformed',
          eyebrow: detail.displayDate || null,
        };
      }

      if (detail.type !== 'podcast') return null;

      const episodes = await repository.getEpisodes();
      const episode = matchEpisode(episodes, detail.episodeNumber, detail.title);
      if (!episode) return null;

      const numberLabel = episode.episodeNumber != null ? `Episode ${episode.episodeNumber}` : null;
      const dateLabel = detail.displayDate || episode.publishedAt || null;
      return {
        resource,
        audioUrl: episode.audioUrl,
        durationSec: episode.durationSec,
        artworkUrl: detail.imageUrl ?? episode.artworkUrl,
        artist,
        album: PODCAST_SHOW_TITLE,
        eyebrow: [numberLabel, dateLabel].filter(Boolean).join(' · ') || null,
      };
    },
  };
}

/** Match a WordPress podcast record to its RSS item: episode number first, then title. */
export function matchEpisode(
  episodes: readonly PodcastEpisode[],
  episodeNumber: number | null,
  title: string,
): PodcastEpisode | null {
  if (episodeNumber != null) {
    const byNumber = episodes.find((e) => e.episodeNumber === episodeNumber);
    if (byNumber) return byNumber;
  }
  const wanted = normalizeTitle(title);
  return episodes.find((e) => normalizeTitle(e.title) === wanted) ?? null;
}

/** Case/punctuation-insensitive comparison ("&" and "and" treated alike). */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
