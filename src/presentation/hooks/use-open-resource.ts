import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import type { Resource } from '@/domain/resource';

/**
 * Returns a callback that navigates to a resource's detail/Reader screen. The title
 * rides along as a param so the destination header can render before the body loads.
 */
export function useOpenResource() {
  const router = useRouter();
  return useCallback(
    (resource: Pick<Resource, 'type' | 'slug' | 'title'>) => {
      router.push({
        pathname: '/resource/[type]/[slug]',
        params: { type: resource.type, slug: resource.slug, title: resource.title },
      });
    },
    [router],
  );
}
