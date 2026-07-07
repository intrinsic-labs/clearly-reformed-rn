import { describe, expect, it } from '@jest/globals';

import { formatPubDate, parseDuration, parseLbeFeed } from '@/data/rss/lbe-podcast-repository';

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
  <channel>
    <title><![CDATA[Life and Books and Everything]]></title>
    <itunes:image href="https://media.rss.com/lbe/cover.jpg"/>
    <item>
      <title><![CDATA[America 250 with Justin Taylor and Collin Hansen]]></title>
      <guid isPermaLink="false"><![CDATA[abc-123]]></guid>
      <pubDate>Tue, 09 Jun 2026 09:00:00 GMT</pubDate>
      <description><![CDATA[<p>A true LBE spectacular.</p>]]></description>
      <enclosure url="https://content.rss.com/lbe/ep194.mp3" type="audio/mpeg" length="80000000"/>
      <itunes:episode>194</itunes:episode>
      <itunes:duration>5096</itunes:duration>
    </item>
    <item>
      <title><![CDATA[Older Episode]]></title>
      <guid>def-456</guid>
      <pubDate>Mon, 01 Jan 2024 09:00:00 GMT</pubDate>
      <description><![CDATA[Notes]]></description>
      <enclosure url="https://content.rss.com/lbe/ep1.mp3" type="audio/mpeg" length="1"/>
      <itunes:duration>1:24:56</itunes:duration>
    </item>
    <item>
      <title><![CDATA[Broken item without audio]]></title>
    </item>
  </channel>
</rss>`;

describe('parseLbeFeed', () => {
  const episodes = parseLbeFeed(FEED);

  it('maps items with enclosures and skips those without', () => {
    expect(episodes).toHaveLength(2);
    expect(episodes[0]).toMatchObject({
      guid: 'abc-123',
      episodeNumber: 194,
      title: 'America 250 with Justin Taylor and Collin Hansen',
      audioUrl: 'https://content.rss.com/lbe/ep194.mp3',
      durationSec: 5096,
      publishedAt: 'Jun 9, 2026',
    });
  });

  it('falls back to the channel artwork', () => {
    expect(episodes[0].artworkUrl).toBe('https://media.rss.com/lbe/cover.jpg');
  });

  it('handles missing episode numbers and colon durations', () => {
    expect(episodes[1].episodeNumber).toBeNull();
    expect(episodes[1].durationSec).toBe(5096);
  });
});

describe('parseDuration', () => {
  it('parses plain seconds, MM:SS, and HH:MM:SS', () => {
    expect(parseDuration('5096')).toBe(5096);
    expect(parseDuration(5096)).toBe(5096);
    expect(parseDuration('57:51')).toBe(3471);
    expect(parseDuration('1:24:56')).toBe(5096);
    expect(parseDuration(undefined)).toBeNull();
    expect(parseDuration('nonsense')).toBeNull();
  });
});

describe('formatPubDate', () => {
  it('formats RFC dates and passes through junk', () => {
    expect(formatPubDate('Tue, 09 Jun 2026 09:00:00 GMT')).toBe('Jun 9, 2026');
    expect(formatPubDate('not a date')).toBe('not a date');
  });
});
