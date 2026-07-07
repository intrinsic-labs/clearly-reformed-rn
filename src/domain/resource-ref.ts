import type { ContentType, Resource } from '@/domain/resource';

/**
 * A compact, self-contained snapshot of a resource for local persistence — notebook
 * entries, progress rows, saved items, and downloads all embed one so they can render
 * a source card fully offline (no refetch, no join against the network).
 *
 * `key` is the stable identity used across every local table: WordPress ids are only
 * unique per post type, so the key namespaces the id by type.
 */
export interface ResourceRef {
  /** Stable identity: `${type}:${id}`. */
  readonly key: string;
  readonly id: number;
  readonly type: ContentType;
  /** Routing key for the detail/Reader screen. */
  readonly slug: string;
  readonly title: string;
  readonly thumbnailUrl: string | null;
  /** Secondary card line — author/speaker or show name. May be empty. */
  readonly subtitle: string;
  /** Canonical web URL (sharing). */
  readonly link: string;
}

/** Build the stable local identity for a resource. */
export function resourceKey(type: ContentType, id: number): string {
  return `${type}:${id}`;
}

/** Snapshot a feed/detail resource into the persistable reference shape. */
export function toResourceRef(resource: Resource): ResourceRef {
  return {
    key: resourceKey(resource.type, resource.id),
    id: resource.id,
    type: resource.type,
    slug: resource.slug,
    title: resource.title,
    thumbnailUrl: resource.thumbnailUrl ?? resource.imageUrl,
    subtitle: resource.people[0] ?? '',
    link: resource.link,
  };
}
