import type {
  ResourceContentQuery,
  ResourceContentRepository,
} from '@/application/ports/resource-content-repository';
import type { ResourceDetail } from '@/domain/resource-detail';
import { getBibleBookNames } from '@/data/api/bible-books';
import type { ResourceDetailDto } from '@/data/api/dto/resource-detail.dto';
import { TYPE_PATH } from '@/data/api/endpoints';
import { getList } from '@/data/api/http-client';
import { mapResourceDetail } from '@/data/api/mappers/resource-detail-mapper';

/**
 * Reads a single resource's full body from WordPress and maps it onto the domain.
 * Implements the application's ResourceContentRepository port; the composition root
 * injects it, so nothing above the data layer knows about WordPress.
 *
 * `wp/v2/{type}?slug=` returns an array (slugs are unique per type), so we take the
 * first item — or null when the slug doesn't resolve.
 */
export function createWordPressResourceContentRepository(): ResourceContentRepository {
  return {
    async getContent(query: ResourceContentQuery): Promise<ResourceDetail | null> {
      const { data } = await getList<ResourceDetailDto[]>(TYPE_PATH[query.type], {
        slug: query.slug,
      });

      const dto = data[0];
      if (!dto) return null;
      const detail = mapResourceDetail(dto);
      return { ...detail, scriptureRef: await withBookName(detail.scriptureRef, dto.bible_book) };
    },
  };
}

/**
 * `acf.scriptureReference` usually omits the book ("3:1–2"); the book itself is a
 * `bible_book` taxonomy term. Prefix the term name when the reference has no letters.
 */
async function withBookName(
  scriptureRef: string | null,
  bookIds: readonly number[] | undefined,
): Promise<string | null> {
  if (!scriptureRef || /[A-Za-z]/.test(scriptureRef) || !bookIds?.length) return scriptureRef;
  const names = await getBibleBookNames();
  const book = names.get(bookIds[0]);
  return book ? `${book} ${scriptureRef}` : scriptureRef;
}
