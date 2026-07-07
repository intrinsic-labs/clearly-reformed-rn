import Storage from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

/**
 * Reader typography preferences — device-local render-time settings (not part of
 * the synced personal layer). Backed by expo-sqlite/kv-store's synchronous API so
 * the Reader opens with the right typography on first paint.
 */

export type ReaderTheme = 'paper' | 'white' | 'sepia' | 'night';
export type ReaderFont = 'serif' | 'sans';
export type ReaderMode = 'curl' | 'slide' | 'scroll';

export interface ReaderPrefs {
  readonly theme: ReaderTheme;
  readonly font: ReaderFont;
  /** Index into FONT_SIZES_PX. */
  readonly sizeIndex: number;
  /** Index into LINE_HEIGHTS. */
  readonly lineIndex: number;
  readonly mode: ReaderMode;
}

/** From the Reader mockup's settings sheet. */
export const FONT_SIZES_PX = [16, 17, 18, 20, 22] as const;
export const LINE_HEIGHTS = [1.45, 1.62, 1.85] as const;

export const DEFAULT_PREFS: ReaderPrefs = {
  theme: 'paper',
  font: 'serif',
  sizeIndex: 2,
  lineIndex: 1,
  mode: 'scroll',
};

const STORAGE_KEY = 'reader.prefs.v1';

let current: ReaderPrefs = load();
const listeners = new Set<() => void>();

function load(): ReaderPrefs {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ReaderPrefs>;
    return {
      theme: isOneOf(parsed.theme, ['paper', 'white', 'sepia', 'night']) ? parsed.theme : DEFAULT_PREFS.theme,
      font: isOneOf(parsed.font, ['serif', 'sans']) ? parsed.font : DEFAULT_PREFS.font,
      sizeIndex: clampIndex(parsed.sizeIndex, FONT_SIZES_PX.length, DEFAULT_PREFS.sizeIndex),
      lineIndex: clampIndex(parsed.lineIndex, LINE_HEIGHTS.length, DEFAULT_PREFS.lineIndex),
      mode: isOneOf(parsed.mode, ['curl', 'slide', 'scroll']) ? parsed.mode : DEFAULT_PREFS.mode,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value);
}

function clampIndex(value: unknown, length: number, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < length ? value : fallback;
}

export function setReaderPrefs(changes: Partial<ReaderPrefs>): void {
  current = { ...current, ...changes };
  try {
    Storage.setItemSync(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Persisting is best-effort; the in-memory value still applies this session.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReaderPrefs(): ReaderPrefs {
  return useSyncExternalStore(subscribe, () => current);
}
