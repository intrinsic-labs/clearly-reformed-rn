import type { FeedOrder } from '@/application/ports/resource-repository';
import type { ContentType } from '@/domain/resource';
import type { MenuOption } from '@/presentation/components/menu/dropdown-menu';

/** The active Library type filter: a content type, or "all". */
export type ContentFilter = ContentType | 'all';

/** The type menu — a curated subset; the rest still show under "All Resources". */
export const TYPE_OPTIONS: readonly MenuOption<ContentFilter>[] = [
  { value: 'all', label: 'All Resources' },
  { value: 'article', label: 'Articles' },
  { value: 'video', label: 'Videos' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'sermon', label: 'Sermons' },
  { value: 'lecture', label: 'Lectures' },
  { value: 'conference', label: 'Coram Deo' },
  { value: 'book', label: 'Books' },
];

/**
 * The sort menu. The unified feed only comes newest-first from the API, so
 * "Oldest" is offered but disabled until a type is chosen.
 */
export function sortOptions(filter: ContentFilter): readonly MenuOption<FeedOrder>[] {
  const isAll = filter === 'all';
  return [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest', disabled: isAll, hint: isAll ? 'Choose a type first' : undefined },
  ];
}

export function labelFor<T extends string>(options: readonly MenuOption<T>[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
