import type { PlayableTrack } from '@/domain/playable';
import type { ResourceRef } from '@/domain/resource-ref';

export type DownloadStatus = 'downloading' | 'done' | 'failed';

export interface DownloadRecord {
  readonly resource: ResourceRef;
  readonly audioUrl: string;
  /** Local file URI once (and only meaningfully when) status is 'done'. */
  readonly fileUri: string;
  readonly status: DownloadStatus;
  readonly bytesTotal: number | null;
  readonly bytesDone: number;
  readonly updatedAt: number;
}

export interface DownloadProgress {
  readonly bytesWritten: number;
  readonly totalBytes: number | null;
}

/**
 * Offline audio downloads (SPEC §6): files land in the app's document storage,
 * state lives in the local DB so the library of downloads survives restarts.
 * Device-local only — never part of sync.
 */
export interface DownloadsRepository {
  /** Download a track's audio; resolves when the file is fully on disk. */
  start(track: PlayableTrack, onProgress?: (progress: DownloadProgress) => void): Promise<DownloadRecord>;
  /** Delete the file and its record. */
  remove(resourceKey: string): Promise<void>;
  get(resourceKey: string): Promise<DownloadRecord | null>;
  list(): Promise<readonly DownloadRecord[]>;
  /** The playable local URI for a resource, or null when not downloaded. */
  localUri(resourceKey: string): Promise<string | null>;
}
