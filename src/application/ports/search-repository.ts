import type { Resource } from '@/domain/resource';

/**
 * Keyword search across the full corpus (`wp/v2/search` today). Results map onto the
 * same card vocabulary as the feed so the UI reuses its card components. The v2
 * semantic search becomes a sibling port, not a replacement.
 */
export interface SearchRepository {
  search(term: string): Promise<readonly Resource[]>;
}
