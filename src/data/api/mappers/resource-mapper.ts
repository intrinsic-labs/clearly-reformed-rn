import type { ContentType, Resource } from '@/domain/resource';
import type { AllResourcesItemDto } from '@/data/api/dto/all-resources.dto';

/**
 * WordPress post type → domain ContentType. Confirmed against the live probe; the
 * unified feed uses the real post type (unlike `wp/v2/search`, which uses `subtype`).
 */
const TYPE_MAP: Record<string, ContentType> = {
  post: 'article',
  'explainer-video': 'video',
  podcast_episode: 'podcast',
  podcast: 'podcast',
  sermon: 'sermon',
  'sermon-clip': 'sermon-clip',
  lecture: 'lecture',
  conference: 'conference',
  'coram-deo': 'conference',
  book: 'book',
  event: 'event',
};

export function toContentType(wpType: string): ContentType {
  return TYPE_MAP[wpType] ?? 'article';
}

/** Decode the handful of HTML entities WordPress leaves in `*.rendered` / excerpt text. */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#8217;|&#x2019;/g, '’')
    .replace(/&#8216;|&#x2018;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/g, '’');
}

/** Strip any residual HTML tags (excerpts occasionally arrive wrapped). */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

/** Pick a smaller image variant for thumbnails (only `medium` is actually resized). */
function thumbnailFor(dto: AllResourcesItemDto): string | null {
  const medium = dto.better_featured_image?.media_details?.sizes?.medium?.source_url;
  return medium || dto.featured_image_url || null;
}

/** Map a raw `all-resources` / per-type feed item onto the domain `Resource` vocabulary. */
export function mapResource(dto: AllResourcesItemDto): Resource {
  const scriptureRef = dto.acf?.scriptureReference?.trim();
  return {
    id: dto.id,
    type: toContentType(dto.type),
    title: decodeEntities(dto.title.rendered),
    slug: dto.slug,
    excerpt: decodeEntities(stripHtml(dto.excerpt)),
    imageUrl: dto.featured_image_url || null,
    thumbnailUrl: thumbnailFor(dto),
    displayDate: dto.date,
    people: dto.people_display ?? [],
    link: dto.link,
    videoUrl: dto.videoEmbed || null,
    scriptureRef: scriptureRef ? scriptureRef : null,
  };
}
