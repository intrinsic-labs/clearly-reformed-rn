import { describe, expect, it, jest } from '@jest/globals';

import {
  buildReaderHtml,
  type ReaderHeaderInfo,
  type ReaderInsets,
  type ReaderWebPrefs,
} from '@/presentation/reader/reader-html';

/**
 * Golden test for the generated Reader document. The output is a single string
 * (HTML shell + stylesheet + browser runtime), so any refactor of how it is
 * assembled must reproduce it byte for byte — these snapshots are the contract.
 *
 * The embedded fonts are ~560KB of base64 that would swamp the snapshot; they are
 * replaced with short sentinels so the @font-face interpolation sites stay pinned
 * while the snapshot remains reviewable.
 */
jest.mock('@/presentation/reader/fonts-base64', () => ({
  FLECHA_DISPLAY_OTF: '__FLECHA_DISPLAY_OTF__',
  FLECHA_TEXT_OTF: '__FLECHA_TEXT_OTF__',
  PLEX_SANS_TTF: '__PLEX_SANS_TTF__',
}));

const header: ReaderHeaderInfo = {
  eyebrow: 'Article & Essay',
  title: 'The "Whole" Counsel <of> God',
  byline: 'Kevin DeYoung · 12 min read',
  scripture: 'Acts 20:27',
};

const insets: ReaderInsets = { top: 47.33, bottom: 34 };

const bodyHtml = [
  '<p>First paragraph with an <a href="https://clearlyreformed.org/x">inline link</a>.</p>',
  '<h2>A heading</h2>',
  '<blockquote><p>Quoted words &amp; entities.</p></blockquote>',
  '<ul><li>One</li><li>Two</li></ul>',
  '<figure><img src="https://x.org/pic.jpg" alt=""><figcaption>Caption</figcaption></figure>',
  '<p>Last paragraph.</p>',
].join('\n');

const scrollPrefs: ReaderWebPrefs = {
  bg: '#F6F1E7',
  fg: '#1E1A14',
  sub: '#6F6A60',
  hair: '#E3DCCB',
  bodyFont: 'FlechaText',
  fontSizePx: 19,
  lineHeight: 1.62,
  paged: false,
  curlShade: false,
};

const pagedPrefs: ReaderWebPrefs = {
  bg: '#14120E',
  fg: '#EDE6D6',
  sub: '#9A937F',
  hair: '#2A261E',
  bodyFont: 'PlexSans',
  fontSizePx: 17,
  lineHeight: 1.5,
  paged: true,
  curlShade: true,
};

describe('buildReaderHtml', () => {
  it('scroll mode, no video, full header', () => {
    const html = buildReaderHtml(bodyHtml, header, insets, scrollPrefs, 'https://clearlyreformed.org/article/x');
    expect(html).toMatchSnapshot();
  });

  it('paged + curl shade, with video header, minimal byline/scripture', () => {
    const html = buildReaderHtml(
      bodyHtml,
      { ...header, byline: '', scripture: null },
      { top: 0, bottom: 0 },
      pagedPrefs,
      'not a url',
      { youtubeId: 'abc DEF&123' },
    );
    expect(html).toMatchSnapshot();
  });

  it('paged without shade, video explicitly null', () => {
    const html = buildReaderHtml(
      '<p>Solo.</p>',
      header,
      insets,
      { ...pagedPrefs, curlShade: false },
      'https://control.kdy.org/wp-json/',
      null,
    );
    expect(html).toMatchSnapshot();
  });
});
