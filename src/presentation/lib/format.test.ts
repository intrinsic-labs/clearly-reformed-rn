import { describe, expect, it } from '@jest/globals';

import { formatRate, formatTime, relativeDate, shortDate } from '@/presentation/lib/format';

describe('formatTime', () => {
  it('formats minutes and seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(75)).toBe('1:15');
    expect(formatTime(1334)).toBe('22:14');
  });

  it('formats hours with padded minutes', () => {
    expect(formatTime(5096)).toBe('1:24:56');
  });

  it('clamps negatives', () => {
    expect(formatTime(-5)).toBe('0:00');
  });
});

describe('formatRate', () => {
  it('renders clean multipliers', () => {
    expect(formatRate(1)).toBe('1×');
    expect(formatRate(1.25)).toBe('1.25×');
    expect(formatRate(1.5)).toBe('1.5×');
    expect(formatRate(2)).toBe('2×');
  });
});

describe('shortDate', () => {
  it('abbreviates month names', () => {
    expect(shortDate('June 23, 2026')).toBe('Jun 23, 2026');
  });

  it('passes through unrecognized input', () => {
    expect(shortDate('20260628')).toBe('20260628');
  });
});

describe('relativeDate', () => {
  const now = new Date('2026-07-07T12:00:00').getTime();

  it('uses minutes and hours for today', () => {
    expect(relativeDate(now - 5 * 60_000, now)).toBe('5m ago');
    expect(relativeDate(now - 2 * 3_600_000, now)).toBe('2h ago');
  });

  it('uses Yesterday and weekday names within the week', () => {
    expect(relativeDate(now - 26 * 3_600_000, now)).toBe('Yesterday');
    expect(relativeDate(new Date('2026-07-03T09:00:00').getTime(), now)).toBe('Fri');
  });

  it('falls back to a short date after a week', () => {
    expect(relativeDate(new Date('2026-06-14T09:00:00').getTime(), now)).toBe('Jun 14');
  });
});
