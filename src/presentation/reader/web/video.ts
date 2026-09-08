import type { ReaderVideoInfo } from '@/presentation/reader/web/types';

/**
 * The YouTube embed shown above the body for video posts. The embed's `origin`
 * must match the document's base URL origin or the IFrame API rejects playback.
 */
export function videoMarkup(video: ReaderVideoInfo | null | undefined, documentBaseUrl: string): string {
  if (!video) return '';
  const embedOrigin = originFromUrl(documentBaseUrl);
  return `
    <figure class="reader-video">
      <iframe
        src="https://www.youtube.com/embed/${encodeURIComponent(video.youtubeId)}?playsinline=1&rel=0&origin=${encodeURIComponent(embedOrigin)}"
        title="Video player"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="origin-when-cross-origin"
        allowfullscreen>
      </iframe>
    </figure>`;
}

function originFromUrl(url: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/[^/]+/i.exec(url);
  return match?.[0] ?? 'https://control.kdy.org';
}
