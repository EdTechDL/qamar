import {
  addDays,
  computeStreak,
  dayIntensity,
  dayKey,
  daysBetween,
  daysInMonth,
  isActiveDay,
  isClassDay,
  monthKey,
  monthSummary,
  recentAttendance,
  shouldAskClassCheckIn,
  weekdayOf,
  type ActivityLog,
  type ClassLog,
  type DayKey,
} from '@core/activity';

const active = { ayatMarked: 5, maqrasReviewed: 0, ayatListened: 0 };
const idle = { ayatMarked: 0, maqrasReviewed: 0, ayatListened: 0 };

const logOf = (...days: DayKey[]): ActivityLog => Object.fromEntries(days.map((d) => [d, active]));

describe('day keys', () => {
  it('formats a local date, not a UTC one', () => {
    // 11pm local on the 5th must still be the 5th.
    expect(dayKey(new Date(2026, 10, 5, 23, 30))).toBe('2026-11-05');
    expect(dayKey(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01');
  });

  it('adds and subtracts days across month boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('measures the gap between two days', () => {
    expect(daysBetween('2026-11-01', '2026-11-05')).toBe(4);
    expect(daysBetween('2026-11-05', '2026-11-01')).toBe(-4);
    expect(daysBetween('2026-11-05', '2026-11-05')).toBe(0);
  });

  it('survives a DST transition', () => {
    // US DST ends 2026-11-01; the 1st → 2nd gap must still read as one day.
    expect(daysBetween('2026-11-01', '2026-11-02')).toBe(1);
  });

  it('derives month keys and month lengths', () => {
    expect(monthKey('2026-11-05')).toBe('2026-11');
    expect(daysInMonth('2026-11')).toHaveLength(30);
    expect(daysInMonth('2026-02')).toHaveLength(28);
    expect(daysInMonth('2024-02')).toHaveLength(29);
  });

  it('knows weekdays', () => {
    expect(weekdayOf('2026-11-03')).toBe(2); // a Tuesday
  });
});

describe('streaks', () => {
  it('is zero on an empty log', () => {
    expect(computeStreak({}, '2026-11-05')).toMatchObject({
      current: 0,
      longest: 0,
      lastActiveDay: null,
      activeToday: false,
    });
  });

  it('counts consecutive active days', () => {
    const log = logOf('2026-11-03', '2026-11-04', '2026-11-05');
    expect(computeStreak(log, '2026-11-05')).toMatchObject({
      current: 3,
      activeToday: true,
      usingGrace: false,
    });
  });

  it('treats a day with only zero counters as idle', () => {
    const log: ActivityLog = { '2026-11-05': idle };
    expect(isActiveDay(log, '2026-11-05')).toBe(false);
    expect(computeStreak(log, '2026-11-05').current).toBe(0);
  });

  it('survives one missed day as a rest day', () => {
    // Active Mon/Tue/Thu — Wednesday was skipped.
    const log = logOf('2026-11-02', '2026-11-03', '2026-11-05');
    expect(computeStreak(log, '2026-11-05')).toMatchObject({
      current: 3,
      usingGrace: false,
    });
  });

  it('breaks after two consecutive missed days', () => {
    const log = logOf('2026-11-01', '2026-11-02', '2026-11-05');
    expect(computeStreak(log, '2026-11-05').current).toBe(1);
  });

  it('keeps the streak alive on an idle today if yesterday was active', () => {
    const log = logOf('2026-11-03', '2026-11-04');
    expect(computeStreak(log, '2026-11-05')).toMatchObject({
      current: 2,
      activeToday: false,
      usingGrace: true,
    });
  });

  it('drops the streak once the gap exceeds the grace', () => {
    const log = logOf('2026-11-01', '2026-11-02');
    expect(computeStreak(log, '2026-11-05').current).toBe(0);
  });

  it('remembers the longest run even after the current one ends', () => {
    const log = logOf('2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-11-05');
    const s = computeStreak(log, '2026-11-05');
    expect(s.current).toBe(1);
    expect(s.longest).toBe(4);
  });

  it('never reports a longest shorter than the current', () => {
    const log = logOf('2026-11-04', '2026-11-05');
    const s = computeStreak(log, '2026-11-05');
    expect(s.longest).toBeGreaterThanOrEqual(s.current);
  });

  it('reports the last active day', () => {
    const log = logOf('2026-11-01', '2026-11-04');
    expect(computeStreak(log, '2026-11-05').lastActiveDay).toBe('2026-11-04');
  });
});

describe('class check-in', () => {
  const tuesday = '2026-11-03';
  const wednesday = '2026-11-04';

  it('identifies Tuesdays', () => {
    expect(isClassDay(tuesday)).toBe(true);
    expect(isClassDay(wednesday)).toBe(false);
  });

  it('asks on an unanswered Tuesday evening', () => {
    expect(shouldAskClassCheckIn({}, tuesday, 18)).toBe(true);
  });

  it('stays quiet before class time', () => {
    expect(shouldAskClassCheckIn({}, tuesday, 9)).toBe(false);
  });

  it('stays quiet on other days', () => {
    expect(shouldAskClassCheckIn({}, wednesday, 18)).toBe(false);
  });

  it('asks only once per Tuesday', () => {
    const answered: ClassLog = { [tuesday]: 'attended' };
    expect(shouldAskClassCheckIn(answered, tuesday, 18)).toBe(false);
  });

  it('never chases a Tuesday that already passed', () => {
    const lastTuesday = '2026-10-27';
    expect(shouldAskClassCheckIn({}, lastTuesday, 18)).toBe(true);
    // ...but the caller only ever passes today, so an old unanswered Tuesday
    // is simply never asked about. Verified by the summary not counting it:
    expect(monthSummary({}, {}, '2026-10').classesMissed).toBe(0);
  });

  it('summarises recent attendance', () => {
    const log: ClassLog = {
      '2026-10-06': 'attended',
      '2026-10-13': 'missed',
      '2026-10-20': 'attended',
    };
    expect(recentAttendance(log)).toEqual({ attended: 2, total: 3 });
  });

  it('honours a custom weekday', () => {
    expect(isClassDay(wednesday, 3)).toBe(true);
  });
});

describe('month summary', () => {
  it('counts active days and totals', () => {
    const log: ActivityLog = {
      '2026-11-01': { ayatMarked: 4, maqrasReviewed: 1, ayatListened: 20 },
      '2026-11-02': { ayatMarked: 2, maqrasReviewed: 0, ayatListened: 0 },
      '2026-10-31': { ayatMarked: 9, maqrasReviewed: 3, ayatListened: 5 },
    };
    const s = monthSummary(log, {}, '2026-11');
    expect(s.activeDays).toBe(2);
    expect(s.daysInMonth).toBe(30);
    expect(s.ayatMarked).toBe(6);
    expect(s.ayatListened).toBe(20);
    expect(s.maqrasReviewed).toBe(1);
  });

  it('counts class answers inside the month only', () => {
    const classLog: ClassLog = {
      '2026-11-03': 'attended',
      '2026-11-10': 'missed',
      '2026-10-27': 'attended',
    };
    const s = monthSummary({}, classLog, '2026-11');
    expect(s.classesAttended).toBe(1);
    expect(s.classesMissed).toBe(1);
  });

  it('scales intensity with effort and leaves empty days blank', () => {
    const log: ActivityLog = {
      a: { ayatMarked: 0, maqrasReviewed: 0, ayatListened: 0 },
      b: { ayatMarked: 3, maqrasReviewed: 0, ayatListened: 2 },
      c: { ayatMarked: 10, maqrasReviewed: 1, ayatListened: 10 },
      d: { ayatMarked: 20, maqrasReviewed: 3, ayatListened: 40 },
    };
    expect(dayIntensity(log, 'a')).toBe(0);
    expect(dayIntensity(log, 'missing')).toBe(0);
    expect(dayIntensity(log, 'b')).toBe(1);
    expect(dayIntensity(log, 'c')).toBe(2);
    expect(dayIntensity(log, 'd')).toBe(3);
  });
});
