import { Directory, File, Paths } from 'expo-file-system';

import type {
  DownloadProgress,
  DownloadRecord,
  DownloadsRepository,
  DownloadStatus,
} from '@/application/ports/downloads-repository';
import type { PlayableTrack } from '@/domain/playable';
import type { ResourceRef } from '@/domain/resource-ref';
import { getDatabase } from '@/data/db/database';

/**
 * Audio downloads over expo-file-system's task API + the local `downloads` table.
 * Files live in Documents/audio (persistent, not purgeable cache); rows track
 * status so the UI and playback can reason about offline availability.
 */
export function createFileDownloadsRepository(): DownloadsRepository {
  const audioDir = () => new Directory(Paths.document, 'audio');

  return {
    async start(track: PlayableTrack, onProgress?: (progress: DownloadProgress) => void): Promise<DownloadRecord> {
      const db = await getDatabase();
      const key = track.resource.key;
      const dir = audioDir();
      if (!dir.exists) dir.create({ intermediates: true });

      const file = new File(dir, `${key.replace(/[^\w-]/g, '_')}.mp3`);
      if (file.exists) file.delete();

      const now = Date.now();
      await db.runAsync(
        `INSERT INTO downloads (resource_key, resource_json, audio_url, file_uri, status, bytes_total, bytes_done, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'downloading', NULL, 0, ?, ?)
         ON CONFLICT(resource_key) DO UPDATE SET
           audio_url = excluded.audio_url,
           file_uri = excluded.file_uri,
           status = 'downloading',
           bytes_total = NULL,
           bytes_done = 0,
           updated_at = excluded.updated_at`,
        [key, JSON.stringify(track.resource), track.audioUrl, file.uri, now, now],
      );

      try {
        const task = File.createDownloadTask(track.audioUrl, file, {
          onProgress: ({ bytesWritten, totalBytes }) =>
            onProgress?.({ bytesWritten, totalBytes: totalBytes > 0 ? totalBytes : null }),
        });
        await task.downloadAsync();

        const size = file.exists ? (file.size ?? 0) : 0;
        await db.runAsync(
          `UPDATE downloads SET status = 'done', bytes_total = ?, bytes_done = ?, updated_at = ? WHERE resource_key = ?`,
          [size, size, Date.now(), key],
        );
        const record = await readRecord(key);
        if (!record) throw new Error('Download record missing after completion');
        return record;
      } catch (error) {
        await db.runAsync(`UPDATE downloads SET status = 'failed', updated_at = ? WHERE resource_key = ?`, [
          Date.now(),
          key,
        ]);
        if (file.exists) file.delete();
        throw error;
      }
    },

    async remove(resourceKey: string): Promise<void> {
      const db = await getDatabase();
      const record = await readRecord(resourceKey);
      if (record) {
        try {
          const file = new File(record.fileUri);
          if (file.exists) file.delete();
        } catch {
          // A missing file must not block removing the record.
        }
      }
      await db.runAsync('DELETE FROM downloads WHERE resource_key = ?', [resourceKey]);
    },

    get: (resourceKey) => readRecord(resourceKey),

    async list(): Promise<readonly DownloadRecord[]> {
      const db = await getDatabase();
      const rows = await db.getAllAsync<DownloadRow>('SELECT * FROM downloads ORDER BY updated_at DESC');
      return rows.map(mapRow);
    },

    async localUri(resourceKey: string): Promise<string | null> {
      const record = await readRecord(resourceKey);
      if (!record || record.status !== 'done') return null;
      try {
        const file = new File(record.fileUri);
        return file.exists ? record.fileUri : null;
      } catch {
        return null;
      }
    },
  };
}

async function readRecord(resourceKey: string): Promise<DownloadRecord | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DownloadRow>('SELECT * FROM downloads WHERE resource_key = ?', [resourceKey]);
  return row ? mapRow(row) : null;
}

interface DownloadRow {
  resource_key: string;
  resource_json: string;
  audio_url: string;
  file_uri: string;
  status: DownloadStatus;
  bytes_total: number | null;
  bytes_done: number | null;
  updated_at: number;
}

function mapRow(row: DownloadRow): DownloadRecord {
  return {
    resource: JSON.parse(row.resource_json) as ResourceRef,
    audioUrl: row.audio_url,
    fileUri: row.file_uri,
    status: row.status,
    bytesTotal: row.bytes_total,
    bytesDone: row.bytes_done ?? 0,
    updatedAt: row.updated_at,
  };
}
