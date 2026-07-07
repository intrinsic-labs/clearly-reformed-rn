import { XMLParser } from 'fast-xml-parser';

import type { PodcastRepository } from '@/application/ports/podcast-repository';
import type { PodcastEpisode } from '@/domain/podcast-episode';

/** The Life and Books and Everything feed (RSS.com; separate from WordPress). */
export const LBE_FEED_URL = 'https://media.rss.com/lbe/feed.xml';

/**
 * Reads the podcast RSS feed and maps items onto the domain episode shape. The feed
 * is ~194 items and changes weekly; TanStack Query handles caching above this, so the
 * repository itself is a plain fetch + parse.
 */
export function createLbePodcastRepository(): PodcastRepository {
  return {
    async getEpisodes(): Promise<readonly PodcastEpisode[]> {
      const response = await fetch(LBE_FEED_URL, { headers: { Accept: 'application/rss+xml, text/xml' } });
      if (!response.ok) throw new Error(`RSS feed request failed (HTTP ${response.status})`);
      return parseLbeFeed(await response.text());
    },
  };
}

/** Parse the raw feed XML. Exposed for tests. */
export function parseLbeFeed(xml: string): PodcastEpisode[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml) as RssDocument;
  const channel = doc?.rss?.channel;
  if (!channel) return [];

  const channelArt = channel['itunes:image']?.['@_href'] ?? null;
  const items = asArray(channel.item);

  return items
    .map((item) => mapItem(item, channelArt))
    .filter((episode): episode is PodcastEpisode => episode !== null);
}

function mapItem(item: RssItem, channelArt: string | null): PodcastEpisode | null {
  const audioUrl = item.enclosure?.['@_url'];
  if (!audioUrl) return null;

  return {
    guid: text(item.guid) || audioUrl,
    episodeNumber: toNumber(item['itunes:episode']),
    title: text(item.title),
    audioUrl,
    durationSec: parseDuration(item['itunes:duration']),
    publishedAt: formatPubDate(text(item.pubDate)),
    artworkUrl: item['itunes:image']?.['@_href'] ?? channelArt,
    descriptionHtml: text(item.description),
  };
}

/** `itunes:duration` is either plain seconds ("5096") or "HH:MM:SS" / "MM:SS". */
export function parseDuration(value: string | number | undefined): number | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (!raw.includes(':')) {
    const seconds = Number(raw);
    return Number.isFinite(seconds) ? seconds : null;
  }
  const parts = raw.split(':').map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Tue, 09 Jun 2026 09:00:00 GMT" → "Jun 9, 2026". Falls back to the raw string. */
export function formatPubDate(pubDate: string): string {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return pubDate;
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** fast-xml-parser yields a lone object (not a 1-array) for single children. */
function asArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/** CDATA/typed scalars arrive as string|number|object({#text}) depending on content. */
function text(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && '#text' in (value as Record<string, unknown>)) {
    return text((value as Record<string, unknown>)['#text']);
  }
  return '';
}

function toNumber(value: unknown): number | null {
  const parsed = Number(text(value));
  return text(value) !== '' && Number.isFinite(parsed) ? parsed : null;
}

interface RssDocument {
  rss?: { channel?: RssChannel };
}

interface RssChannel {
  'itunes:image'?: { '@_href'?: string };
  item?: RssItem | RssItem[];
}

interface RssItem {
  title?: unknown;
  guid?: unknown;
  pubDate?: unknown;
  description?: unknown;
  enclosure?: { '@_url'?: string };
  'itunes:episode'?: unknown;
  'itunes:duration'?: string | number;
  'itunes:image'?: { '@_href'?: string };
}
