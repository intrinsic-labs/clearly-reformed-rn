import type { UseCases } from '@/application/use-cases';
import { makeContentUseCases } from '@/application/use-cases/content';
import { makeDailyUseCases } from '@/application/use-cases/daily';
import { makeNotebookUseCases } from '@/application/use-cases/notebook';
import { makePodcastUseCases } from '@/application/use-cases/podcast';
import { makeProgressUseCases } from '@/application/use-cases/progress';
import { makeSavedUseCases } from '@/application/use-cases/saved';
import { makeSearchUseCases } from '@/application/use-cases/search';
import { createWordPressResourceContentRepository } from '@/data/api/wordpress-resource-content-repository';
import { createWordPressResourceRepository } from '@/data/api/wordpress-resource-repository';
import { createWordPressSearchRepository } from '@/data/api/wordpress-search-repository';
import { createSqliteContentCache } from '@/data/db/sqlite-content-cache';
import { createSqliteNotebookRepository } from '@/data/db/sqlite-notebook-repository';
import { createSqliteProgressRepository } from '@/data/db/sqlite-progress-repository';
import { createSqliteSavedRepository } from '@/data/db/sqlite-saved-repository';
import { createLbePodcastRepository } from '@/data/rss/lbe-podcast-repository';

/**
 * Composition root: the one place that knows the concrete implementations. It wires
 * data-layer repositories into application use cases and hands the result to the UI
 * (via the DI context). This is the "main" — the only module allowed to depend on
 * every layer.
 */
export function createContainer(): { useCases: UseCases } {
  const resourceRepository = createWordPressResourceRepository();
  const resourceContentRepository = createWordPressResourceContentRepository();
  const searchRepository = createWordPressSearchRepository();
  const podcastRepository = createLbePodcastRepository();
  const notebookRepository = createSqliteNotebookRepository();
  const progressRepository = createSqliteProgressRepository();
  const savedRepository = createSqliteSavedRepository();
  const contentCache = createSqliteContentCache();

  const useCases: UseCases = {
    content: makeContentUseCases(resourceRepository, resourceContentRepository, contentCache, savedRepository),
    notebook: makeNotebookUseCases(notebookRepository),
    progress: makeProgressUseCases(progressRepository),
    saved: makeSavedUseCases(savedRepository),
    podcast: makePodcastUseCases(podcastRepository),
    search: makeSearchUseCases(searchRepository, contentCache),
    daily: makeDailyUseCases(resourceRepository),
  };

  return { useCases };
}
