import type { ContentUseCases } from '@/application/use-cases/content';
import type { DailyUseCases } from '@/application/use-cases/daily';
import type { DownloadsUseCases } from '@/application/use-cases/downloads';
import type { NotebookUseCases } from '@/application/use-cases/notebook';
import type { PodcastUseCases } from '@/application/use-cases/podcast';
import type { ProgressUseCases } from '@/application/use-cases/progress';
import type { SavedUseCases } from '@/application/use-cases/saved';
import type { SearchUseCases } from '@/application/use-cases/search';

/**
 * Everything the presentation layer may do, grouped by feature. The composition
 * root builds this once with concrete repositories; UI reaches it through the
 * use-cases context and never sees the data layer.
 */
export interface UseCases {
  readonly content: ContentUseCases;
  readonly notebook: NotebookUseCases;
  readonly progress: ProgressUseCases;
  readonly saved: SavedUseCases;
  readonly podcast: PodcastUseCases;
  readonly search: SearchUseCases;
  readonly daily: DailyUseCases;
  readonly downloads: DownloadsUseCases;
}
