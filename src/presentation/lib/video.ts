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
