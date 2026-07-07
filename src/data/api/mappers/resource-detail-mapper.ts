import type { ResourceDetail } from '@/domain/resource-detail';
import type { ResourceDetailDto } from '@/data/api/dto/resource-detail.dto';
import { decodeEntities, stripHtml, toContentType } from '@/data/api/mappers/resource-mapper';

/** Map a raw per-type `?slug=` item onto the domain `ResourceDetail` vocabulary. */
export function mapResourceDetail(dto: ResourceDetailDto): ResourceDetail {
  const acf = dto.acf ?? undefined;
  const videoUrl = acf?.video_embed || acf?.video || null;
  const audioUrl = acf?.audioFile || acf?.podcast_mp3 || null;
  const scriptureRef = acf?.scriptureReference?.trim();
  const imageUrl = dto.featured_image_url || null;

  return {
    id: dto.id,
    type: toContentType(dto.type),
    title: decodeEntities(dto.title.rendered),
    slug: dto.slug,
    excerpt: dto.excerpt ? decodeEntities(stripHtml(dto.excerpt)) : '',
    imageUrl,
    // Detail has no resized variant; the hero uses the full image either way.
    thumbnailUrl: imageUrl,
    displayDate: dto.date,
    people: dto.people_display ?? [],
    link: dto.link,
    videoUrl,
    scriptureRef: scriptureRef ? scriptureRef : null,
    bodyHtml: dto.content?.rendered ?? '',
    audioUrl,
    sourceUrl: acf?.source_url || null,
    episodeNumber: toEpisodeNumber(acf?.['podcast_episode_#']),
  };
}

function toEpisodeNumber(value: number | string | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
