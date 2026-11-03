// Monthly "connection with the Quran" rollup — the calendar view's data.

import { daysInMonth, monthKey } from './days';
import { isActiveDay } from './streak';
import type { ActivityLog, ClassLog, DayKey, MonthSummary } from './types';

export function monthSummary(log: ActivityLog, classLog: ClassLog, month: string): MonthSummary {
  const days = daysInMonth(month);
  let activeDays = 0;
  let ayatMarked = 0;
  let ayatListened = 0;
  let maqrasReviewed = 0;

  for (const day of days) {
    if (isActiveDay(log, day)) activeDays += 1;
    const d = log[day];
    if (!d) continue;
    ayatMarked += d.ayatMarked;
    ayatListened += d.ayatListened;
    maqrasReviewed += d.maqrasReviewed;
  }

  let classesAttended = 0;
  let classesMissed = 0;
  for (const [day, answer] of Object.entries(classLog)) {
    if (monthKey(day) !== month) continue;
    if (answer === 'attended') classesAttended += 1;
    else classesMissed += 1;
  }

  return {
    month,
    activeDays,
    daysInMonth: days.length,
    percent: Math.round((activeDays / days.length) * 1000) / 10,
    ayatMarked,
    ayatListened,
    maqrasReviewed,
    classesAttended,
    classesMissed,
  };
}

/** Per-day intensity 0..3 for the calendar grid. Empty days are 0 (blank,
 *  never red — SPEC §15.5). */
export function dayIntensity(log: ActivityLog, day: DayKey): 0 | 1 | 2 | 3 {
  const d = log[day];
  if (!d) return 0;
  const score = d.ayatMarked + d.ayatListened + d.maqrasReviewed * 5;
  if (score <= 0) return 0;
  if (score < 10) return 1;
  if (score < 30) return 2;
  return 3;
}
