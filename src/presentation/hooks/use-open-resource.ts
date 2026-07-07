import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import type { Resource } from '@/domain/resource';

export interface OpenResourceOptions {
  /** Deep-link into a moment of the resource's video (notebook clips). */
  readonly startAtSec?: number;
  /** Open the Reader scrolled to this highlight (notebook highlight cards). */
  readonly highlightId?: string;
}

/**
 * Returns a callback that navigates to a resource's detail/Reader screen. The title
 * rides along as a param so the destination header can render before the body loads.
 */
export function useOpenResource() {
  const router = useRouter();
  return useCallback(
    (resource: Pick<Resource, 'type' | 'slug' | 'title'>, options?: OpenResourceOptions) => {
      router.push({
        pathname: '/resource/[type]/[slug]',
        params: {
          type: resource.type,
          slug: resource.slug,
          title: resource.title,
          ...(options?.startAtSec != null ? { t: String(Math.floor(options.startAtSec)) } : null),
          ...(options?.highlightId ? { hl: options.highlightId } : null),
        },
      });
    },
    [router],
  );
}
