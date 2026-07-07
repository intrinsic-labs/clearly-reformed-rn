import { describe, expect, it } from '@jest/globals';

import type { PodcastEpisode } from '@/domain/podcast-episode';
import { matchEpisode } from '@/application/use-cases/podcast';

function episode(overrides: Partial<PodcastEpisode>): PodcastEpisode {
  return {
    guid: 'g',
    episodeNumber: null,
    title: 'Untitled',
    audioUrl: 'https://x/audio.mp3',
    durationSec: null,
    publishedAt: 'Jun 1, 2026',
    artworkUrl: null,
    descriptionHtml: '',
    ...overrides,
  };
}

describe('matchEpisode', () => {
  const episodes = [
    episode({ guid: 'a', episodeNumber: 194, title: 'America 250 with Justin Taylor and Collin Hansen' }),
    episode({ guid: 'b', episodeNumber: 193, title: 'The Most Special Guest Ever with Trisha DeYoung' }),
    episode({ guid: 'c', episodeNumber: null, title: 'Bonus: Q&A Special' }),
  ];

  it('matches by episode number first', () => {
    expect(matchEpisode(episodes, 193, 'A Totally Different Title')?.guid).toBe('b');
  });

  it('falls back to normalized title matching', () => {
    expect(matchEpisode(episodes, null, 'America 250 with Justin Taylor & Collin Hansen')?.guid).toBe('a');
  });

  it('normalizes punctuation and case', () => {
    expect(matchEpisode(episodes, null, 'bonus — q&a special!')?.guid).toBe('c');
  });

  it('returns null when nothing matches', () => {
    expect(matchEpisode(episodes, 999, 'Unknown Episode')).toBeNull();
  });
});
