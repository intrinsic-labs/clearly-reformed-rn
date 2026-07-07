import * as Notifications from 'expo-notifications';
import Storage from 'expo-sqlite/kv-store';
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

/**
 * Notification preferences (SPEC §9) — per-category opt-in stored locally.
 *
 * Two tiers:
 *  - `dailyReminder` is fully functional today: a repeating local notification
 *    that points at the Home "Today" surface every morning.
 *  - The per-category "new content" toggles are the client half of push: they
 *    persist now and will gate delivery once the pg_cron ingestion job + Expo
 *    Push pipeline exist (server-side, v1.1). No push tokens are registered yet.
 */

export interface NotificationPrefs {
  readonly dailyReminder: boolean;
  readonly newArticles: boolean;
  readonly newEpisodes: boolean;
  readonly newVideos: boolean;
  readonly conferenceUpdates: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  dailyReminder: false,
  newArticles: true,
  newEpisodes: true,
  newVideos: true,
  conferenceUpdates: false,
};

const STORAGE_KEY = 'notifications.prefs.v1';
const DAILY_REMINDER_ID = 'daily-pick-reminder';
const DAILY_REMINDER_HOUR = 8;

let current: NotificationPrefs = load();
const listeners = new Set<() => void>();

function load(): NotificationPrefs {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    return raw ? { ...DEFAULT_NOTIFICATION_PREFS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) } : DEFAULT_NOTIFICATION_PREFS;
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function useNotificationPrefs(): NotificationPrefs {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}

export async function setNotificationPref<K extends keyof NotificationPrefs>(
  key: K,
  value: NotificationPrefs[K],
): Promise<boolean> {
  if (value === true) {
    const granted = await ensurePermission();
    if (!granted) return false;
  }

  current = { ...current, [key]: value };
  try {
    Storage.setItemSync(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // In-memory value still applies this session.
  }

  if (key === 'dailyReminder') {
    if (value) {
      await scheduleDailyReminder();
    } else {
      await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
    }
  }

  for (const listener of listeners) listener();
  return true;
}

async function ensurePermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const request = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return request.granted;
}

async function scheduleDailyReminder(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Daily pick',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'Today’s pick is ready',
      body: 'Theology for the everyday — something worth your attention this morning.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: DAILY_REMINDER_HOUR,
      minute: 0,
      ...(Platform.OS === 'android' ? { channelId: 'daily' } : null),
    },
  });
}
