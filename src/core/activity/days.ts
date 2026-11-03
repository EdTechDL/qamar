// Local-calendar day helpers. Everything here works on `YYYY-MM-DD` strings
// built from *local* time, so a session at 11pm counts for that day and not
// the next one in UTC.

import type { DayKey } from './types';

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Local calendar day of a Date. */
export function dayKey(d: Date): DayKey {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parse `YYYY-MM-DD` back to a local-midnight Date. */
export function dayKeyToDate(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Shift a day key by N days (negative goes back). */
export function addDays(key: DayKey, n: number): DayKey {
  const d = dayKeyToDate(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Whole days between two keys; positive when `b` is later. */
export function daysBetween(a: DayKey, b: DayKey): number {
  const ms = dayKeyToDate(b).getTime() - dayKeyToDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** `YYYY-MM` of a day key. */
export function monthKey(key: DayKey): string {
  return key.slice(0, 7);
}

/** 0=Sunday … 6=Saturday, in local time. */
export function weekdayOf(key: DayKey): number {
  return dayKeyToDate(key).getDay();
}

/** Every day key in a month, in order. */
export function daysInMonth(month: string): DayKey[] {
  const [y, m] = month.split('-').map(Number);
  const year = y ?? 1970;
  const monthIndex = (m ?? 1) - 1;
  const count = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => `${month}-${pad2(i + 1)}`);
}
