// Streak maths, deliberately forgiving.
//
// A streak that resets to zero the first time life gets in the way is the
// single most reliable way to make an ADHD user abandon an app — it converts
// one missed day into a total loss, which is exactly the all-or-nothing trap
// SPEC §15 exists to avoid. So:
//
//   * one missed day is a REST DAY and does not break the chain
//   * two consecutive missed days end it
//   * rest days are never counted as active, so the number stays honest
//   * nothing anywhere reports how many days were missed (§15.4)

import { addDays, daysBetween } from './days';
import type { ActivityLog, DayKey, StreakSummary } from './types';

/** A day counts as active if anything at all was logged on it. */
export function isActiveDay(log: ActivityLog, day: DayKey): boolean {
  const d = log[day];
  if (!d) return false;
  return d.ayatMarked > 0 || d.maqrasReviewed > 0 || d.ayatListened > 0;
}

/** Maximum consecutive missed days a streak survives. */
export const GRACE_DAYS = 1;

/**
 * Walks backwards from `today`, counting active days and allowing a single
 * missed day between them.
 */
function runLengthEndingAt(log: ActivityLog, end: DayKey): number {
  let count = 0;
  let cursor = end;
  let gapsUsed = 0;

  // Hard stop well past any plausible history, so a corrupt log can't hang.
  for (let guard = 0; guard < 20_000; guard++) {
    if (isActiveDay(log, cursor)) {
      count += 1;
      gapsUsed = 0;
    } else {
      gapsUsed += 1;
      if (gapsUsed > GRACE_DAYS) break;
      // A leading gap (before any active day) is not part of a streak.
      if (count === 0) break;
    }
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function computeStreak(log: ActivityLog, today: DayKey): StreakSummary {
  const activeDays = Object.keys(log)
    .filter((d) => isActiveDay(log, d))
    .sort();

  if (activeDays.length === 0) {
    return {
      current: 0,
      longest: 0,
      lastActiveDay: null,
      activeToday: false,
      usingGrace: false,
    };
  }

  const lastActiveDay = activeDays[activeDays.length - 1]!;
  const activeToday = isActiveDay(log, today);

  // The current streak is anchored at today. If today is idle, the chain is
  // still alive as long as yesterday was active (today is the rest day).
  const sinceLastActive = daysBetween(lastActiveDay, today);
  const current =
    sinceLastActive <= GRACE_DAYS + 0 && sinceLastActive >= 0
      ? runLengthEndingAt(log, activeToday ? today : lastActiveDay)
      : 0;

  // Longest run ever: scan the sorted active days, allowing the same grace.
  let longest = 0;
  let run = 0;
  let prev: DayKey | null = null;
  for (const day of activeDays) {
    if (prev === null) {
      run = 1;
    } else {
      const gap = daysBetween(prev, day);
      run = gap <= GRACE_DAYS + 1 ? run + 1 : 1;
    }
    if (run > longest) longest = run;
    prev = day;
  }

  return {
    current,
    longest: Math.max(longest, current),
    lastActiveDay,
    activeToday,
    usingGrace: current > 0 && !activeToday,
  };
}
