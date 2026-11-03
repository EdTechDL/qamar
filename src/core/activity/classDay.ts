// Tuesday class check-in rules.
//
// The prompt only ever asks about *today*. It never asks the user to account
// for Tuesdays they already let pass — that would be backlog guilt, which
// SPEC §15.4 bans outright.

import { weekdayOf } from './days';
import { CLASS_WEEKDAY, type ClassLog, type DayKey } from './types';

/** Is this day a class day? */
export function isClassDay(day: DayKey, weekday: number = CLASS_WEEKDAY): boolean {
  return weekdayOf(day) === weekday;
}

/** Has the user already answered for this day? */
export function isAnswered(classLog: ClassLog, day: DayKey): boolean {
  return classLog[day] !== undefined;
}

/**
 * Whether to surface the check-in right now. Gated on an hour so the question
 * isn't asked at 7am, before class has happened.
 */
export function shouldAskClassCheckIn(
  classLog: ClassLog,
  day: DayKey,
  hourOfDay: number,
  opts: { weekday?: number; notBefore?: number } = {},
): boolean {
  const weekday = opts.weekday ?? CLASS_WEEKDAY;
  const notBefore = opts.notBefore ?? 16;
  if (!isClassDay(day, weekday)) return false;
  if (isAnswered(classLog, day)) return false;
  return hourOfDay >= notBefore;
}

/** Attendance over the most recent `n` class days that were answered. */
export function recentAttendance(classLog: ClassLog, n = 8): { attended: number; total: number } {
  const answered = Object.entries(classLog)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-n);
  return {
    attended: answered.filter(([, v]) => v === 'attended').length,
    total: answered.length,
  };
}
