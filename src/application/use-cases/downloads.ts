import type {
  DownloadProgress,
  DownloadRecord,
  DownloadsRepository,
} from '@/application/ports/downloads-repository';
import type { PlayableTrack } from '@/domain/playable';

export interface DownloadsUseCases {
  start(track: PlayableTrack, onProgress?: (progress: DownloadProgress) => void): Promise<DownloadRecord>;
  remove(resourceKey: string): Promise<void>;
  get(resourceKey: string): Promise<DownloadRecord | null>;
  list(): Promise<readonly DownloadRecord[]>;
  /**
   * The URL playback should use: the local file when downloaded, otherwise the
   * given remote URL — this is what makes downloaded audio play offline.
   */
  resolvePlaybackUrl(resourceKey: string, remoteUrl: string): Promise<string>;
}

export function makeDownloadsUseCases(repository: DownloadsRepository): DownloadsUseCases {
  return {
    start: (track, onProgress) => repository.start(track, onProgress),
    remove: (resourceKey) => repository.remove(resourceKey),
    get: (resourceKey) => repository.get(resourceKey),
    list: () => repository.list(),
    async resolvePlaybackUrl(resourceKey, remoteUrl) {
      const local = await repository.localUri(resourceKey).catch(() => null);
      return local ?? remoteUrl;
    },
  };
}
