// Read-side hooks over the activity store. All maths lives in @core/activity;
// these just bind it to React and to the current clock.

import { useMemo } from 'react';
import {
  computeStreak,
  dayKey,
  monthKey,
  monthSummary,
  shouldAskClassCheckIn,
  type MonthSummary,
  type StreakSummary,
} from '@core/activity';
import { useActivityStore } from '@stores/activity';

/** Today's local day key, recomputed each render (cheap, and avoids a stale
 *  key if the app is left open past midnight). */
export function useToday(): string {
  return dayKey(new Date());
}

export function useStreak(): StreakSummary {
  const log = useActivityStore((s) => s.log);
  const today = useToday();
  return useMemo(() => computeStreak(log, today), [log, today]);
}

export function useMonthSummary(month?: string): MonthSummary {
  const log = useActivityStore((s) => s.log);
  const classLog = useActivityStore((s) => s.classLog);
  const today = useToday();
  const target = month ?? monthKey(today);
  return useMemo(() => monthSummary(log, classLog, target), [log, classLog, target]);
}

/** Whether the Tuesday check-in should be on screen right now. */
export function useClassCheckIn(): { due: boolean; day: string } {
  const classLog = useActivityStore((s) => s.classLog);
  const weekday = useActivityStore((s) => s.classWeekday);
  const notBefore = useActivityStore((s) => s.classAskAfterHour);
  const today = useToday();
  const hour = new Date().getHours();

  const due = useMemo(
    () => shouldAskClassCheckIn(classLog, today, hour, { weekday, notBefore }),
    [classLog, today, hour, weekday, notBefore],
  );

  return { due, day: today };
}
