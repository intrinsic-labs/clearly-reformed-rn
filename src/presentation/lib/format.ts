const MONTH_ABBR: Record<string, string> = {
  January: 'Jan',
  February: 'Feb',
  March: 'Mar',
  April: 'Apr',
  May: 'May',
  June: 'Jun',
  July: 'Jul',
  August: 'Aug',
  September: 'Sep',
  October: 'Oct',
  November: 'Nov',
  December: 'Dec',
};

/** "June 23, 2026" → "Jun 23, 2026" for compact card meta. Falls back to the input. */
export function shortDate(displayDate: string): string {
  const match = displayDate.match(/^(\w+)\s+(\d+),\s*(\d+)$/);
  if (!match) return displayDate;
  const [, month, day, year] = match;
  return `${MONTH_ABBR[month] ?? month} ${day}, ${year}`;
}

/** Seconds → "22:14" or "1:24:56". Clamps negatives to 0:00. */
export function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Playback rate → "1×", "1.25×", "1.5×". */
export function formatRate(rate: number): string {
  const text = Number.isInteger(rate) ? String(rate) : String(rate).replace(/0+$/, '');
  return `${text}×`;
}

/** Epoch ms → compact relative label for notebook cards: "2h ago", "Yesterday", "Mon", "Jun 14". */
export function relativeDate(epochMs: number, now = Date.now()): string {
  const diffMs = Math.max(0, now - epochMs);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const then = new Date(epochMs);
  const today = new Date(now);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const daysBack = Math.ceil((startOfToday - epochMs) / 86_400_000);
  if (daysBack <= 1) return 'Yesterday';
  if (daysBack < 7) return then.toLocaleDateString('en-US', { weekday: 'short' });
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
