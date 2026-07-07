import TrackPlayer from '@javascriptcommon/react-native-track-player';
import { useSyncExternalStore } from 'react';

/**
 * DIY sleep timer (the v4 player has none built in): a module-level countdown that
 * fades playback out when it fires. The store tracks whole minutes remaining and
 * ticks every 30s, exposed to React through useSyncExternalStore.
 */

/** Cycle order for the moon button: off → 15m → 30m → 45m → 60m → off. */
export const SLEEP_OPTIONS_MIN = [null, 15, 30, 45, 60] as const;

let currentOption: number | null = null;
let endsAt: number | null = null;
let minutesLeft: number | null = null;
let fireTimeout: ReturnType<typeof setTimeout> | null = null;
let tickInterval: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function clearTimers(): void {
  if (fireTimeout) clearTimeout(fireTimeout);
  if (tickInterval) clearInterval(tickInterval);
  fireTimeout = null;
  tickInterval = null;
}

export function setSleepTimer(minutes: number | null): void {
  clearTimers();
  currentOption = minutes;

  if (minutes == null) {
    endsAt = null;
    minutesLeft = null;
    notify();
    return;
  }

  endsAt = Date.now() + minutes * 60_000;
  minutesLeft = minutes;

  tickInterval = setInterval(() => {
    if (endsAt == null) return;
    minutesLeft = Math.max(1, Math.ceil((endsAt - Date.now()) / 60_000));
    notify();
  }, 30_000);

  fireTimeout = setTimeout(() => {
    clearTimers();
    currentOption = null;
    endsAt = null;
    minutesLeft = null;
    // Fade out over 5s rather than cutting off mid-sentence.
    TrackPlayer.fadeOutPause(5000).catch(() => TrackPlayer.pause());
    notify();
  }, minutes * 60_000);

  notify();
}

export function cycleSleepTimer(): void {
  const index = SLEEP_OPTIONS_MIN.findIndex((option) => option === currentOption);
  setSleepTimer(SLEEP_OPTIONS_MIN[(index + 1) % SLEEP_OPTIONS_MIN.length]);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whole minutes until the timer fires, or null when off. */
export function useSleepTimerMinutesLeft(): number | null {
  return useSyncExternalStore(subscribe, () => minutesLeft);
}
