/**
 * Extract a YouTube video id from the various URL shapes the content API returns
 * (`youtu.be/ID`, `youtube.com/watch?v=ID`, `/embed/ID`, `/shorts/ID`), tolerating
 * extra query params like `&t=2s`. Returns null for non-YouTube or unrecognized URLs.
 *
 * All video content is currently YouTube-hosted (confirmed by probe); this is where a
 * non-YouTube branch would hook in if that ever changes.
 */
const YOUTUBE_ID_PATTERNS: readonly RegExp[] = [
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
  /youtube\.com\/embed\/([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/,
];

export function parseYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  for (const pattern of YOUTUBE_ID_PATTERNS) {
    const match = pattern.exec(url);
    if (match) return match[1];
  }
  return null;
}

const LEADING_FIGURE_RE = /^\s*<figure\b[^>]*>[\s\S]*?<\/figure>\s*/i;
const YOUTUBE_URL_RE = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s<"']+/i;

/**
 * WordPress video-backed articles can put a bare YouTube URL inside the first
 * embed figure. When we render our own player, remove that source-only block so
 * the transcript does not start with a duplicate URL.
 */
export function stripLeadingYouTubeEmbed(html: string, expectedUrl?: string | null): string {
  if (!html) return '';
  return html.replace(LEADING_FIGURE_RE, (figure) => {
    const url = YOUTUBE_URL_RE.exec(figure)?.[0];
    if (!url) return figure;

    const embeddedId = parseYouTubeId(url);
    const expectedId = parseYouTubeId(expectedUrl);
    if (expectedId && embeddedId && embeddedId !== expectedId) return figure;

    return '';
  });
}
