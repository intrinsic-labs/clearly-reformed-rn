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
