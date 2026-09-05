import type { ContentType } from '@/domain/resource';

/**
 * Presentation rules per content type. The UI call (2026-09) settled that every
 * type should *not* get the identical card: labels are plain words (no brand glyph),
 * and metadata is shown only where it carries meaning.
 */

/** Human-readable label per content type — sentence case, used as-is. */
export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  article: 'Article',
  video: 'Video',
  podcast: 'Podcast',
  sermon: 'Sermon',
  'sermon-clip': 'Clip',
  lecture: 'Lecture',
  conference: 'Coram Deo',
  book: 'Book',
  event: 'Event',
};

/**
 * Whether a feed card shows the publish date. Dates are noise on evergreen articles
 * and explainer videos, but real context on episodic/dated material (a podcast
 * episode, a sermon preached on a Sunday, a conference session).
 */
export function showsDate(type: ContentType): boolean {
  switch (type) {
    case 'podcast':
    case 'sermon':
    case 'lecture':
    case 'conference':
    case 'event':
      return true;
    default:
      return false;
  }
}

/** Types whose primary experience is playback (audio or video). */
export function isPlayableType(type: ContentType): boolean {
  return type !== 'article' && type !== 'book';
}
