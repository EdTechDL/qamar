// activity-core — pure types. No RN/React/IO imports allowed in this dir.

/** Local calendar day, `YYYY-MM-DD`. Local, not UTC: "today" must match the
 *  user's day, not Greenwich's. */
export type DayKey = string;

/** What the user did on one day. Counters only ever grow within a day. */
export interface DayActivity {
  /** Ayat whose state the user changed. */
  ayatMarked: number;
  /** Maqras played through at least once. */
  maqrasReviewed: number;
  /** Ayat listened to. */
  ayatListened: number;
}

export type ActivityLog = Record<DayKey, DayActivity>;

/** Answer to the Tuesday class check-in. */
export type ClassAnswer = 'attended' | 'missed';

export type ClassLog = Record<DayKey, ClassAnswer>;

export interface StreakSummary {
  /** Consecutive active days ending today or yesterday, grace applied. */
  current: number;
  /** Best run ever recorded. */
  longest: number;
  /** Most recent active day, or null if the log is empty. */
  lastActiveDay: DayKey | null;
  /** True when today itself has activity — drives "keep it going" copy. */
  activeToday: boolean;
  /** True when the streak is only alive because of the rest-day grace. */
  usingGrace: boolean;
}

export interface MonthSummary {
  /** `YYYY-MM` */
  month: string;
  activeDays: number;
  daysInMonth: number;
  /** 0..100, one decimal. */
  percent: number;
  ayatMarked: number;
  ayatListened: number;
  maqrasReviewed: number;
  classesAttended: number;
  classesMissed: number;
}

export const EMPTY_DAY: DayActivity = Object.freeze({
  ayatMarked: 0,
  maqrasReviewed: 0,
  ayatListened: 0,
});

/** Tuesday. `Date.getDay()` is 0=Sunday. */
export const CLASS_WEEKDAY = 2;
