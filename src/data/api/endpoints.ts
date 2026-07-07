import type { ContentType } from '@/domain/resource';

/** The unified chronological feed (all content types). */
export const ALL_RESOURCES_PATH = '/kdy/v1/all-resources';

/**
 * Per-type WordPress endpoints. List form (`?per_page=&page=`) backs the filtered
 * feed; single form (`?slug=`) backs the detail/Reader fetch. Both return the kdy
 * plugin's normalized shape (human dates, resolved `featured_image_url`, plain
 * excerpt), and the single form additionally carries `content.rendered` + `acf`.
 */
export const TYPE_PATH: Record<ContentType, string> = {
  article: '/wp/v2/posts',
  video: '/wp/v2/explainer-video',
  podcast: '/wp/v2/podcast_episode',
  sermon: '/wp/v2/sermon',
  'sermon-clip': '/wp/v2/sermon-clip',
  lecture: '/wp/v2/lecture',
  conference: '/wp/v2/conference',
  book: '/wp/v2/book',
  event: '/wp/v2/event',
};
