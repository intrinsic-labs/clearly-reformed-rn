import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import type { Resource } from '@/domain/resource';

/**
 * Returns a callback that navigates to a resource's detail/Reader screen. The title
 * rides along as a param so the destination header can render before the body loads.
 * `startAtSec` deep-links into a moment of the resource's video (notebook clips).
 */
export function useOpenResource() {
  const router = useRouter();
  return useCallback(
    (resource: Pick<Resource, 'type' | 'slug' | 'title'>, startAtSec?: number) => {
      router.push({
        pathname: '/resource/[type]/[slug]',
        params: {
          type: resource.type,
          slug: resource.slug,
          title: resource.title,
          ...(startAtSec != null ? { t: String(Math.floor(startAtSec)) } : null),
        },
      });
    },
    [router],
  );
}
