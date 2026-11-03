// Monthly connection calendar. One cell per day, shaded by effort.
// Empty days are blank parchment, never red (SPEC §15.5).

import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { dayIntensity, dayKey, daysInMonth, weekdayOf, type ClassAnswer } from '@core/activity';
import { useActivityStore } from '@stores/activity';
import { light } from '@theme/colors';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// A past day with nothing on it is blank parchment; the three active steps
// ramp clearly up to the memorized green so a glance reads effort, not noise.
const INTENSITY_BG: Record<0 | 1 | 2 | 3, string> = {
  0: '#EDE2C4',
  1: '#BBD3A4',
  2: '#79AC85',
  3: light.accent,
};

interface Props {
  /** `YYYY-MM`. Defaults to the current month. */
  month?: string;
}

export function MonthCalendar({ month }: Props) {
  const log = useActivityStore((s) => s.log);
  const classLog = useActivityStore((s) => s.classLog);
  const classWeekday = useActivityStore((s) => s.classWeekday);
  const today = dayKey(new Date());
  const target = month ?? today.slice(0, 7);

  const { cells, leadingBlanks } = useMemo(() => {
    const days = daysInMonth(target);
    const first = days[0];
    return {
      cells: days,
      leadingBlanks: first ? weekdayOf(first) : 0,
    };
  }, [target]);

  return (
    <View style={styles.host}>
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text
            key={`${label}${i}`}
            style={[styles.weekday, i === classWeekday && styles.weekdayClass]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <View key={`blank${i}`} style={styles.cell} />
        ))}

        {cells.map((day) => {
          const intensity = dayIntensity(log, day);
          const answer: ClassAnswer | undefined = classLog[day];
          const isToday = day === today;
          const future = day > today;

          return (
            <View key={day} style={styles.cell}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: future ? 'transparent' : INTENSITY_BG[intensity] },
                  future && styles.dotFuture,
                  isToday && styles.dotToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    intensity >= 2 && styles.dayNumOnDark,
                    future && styles.dayNumFuture,
                  ]}
                >
                  {Number(day.slice(-2))}
                </Text>
              </View>
              {answer ? (
                <View
                  style={[
                    styles.classPip,
                    answer === 'attended' ? styles.classAttended : styles.classMissed,
                  ]}
                />
              ) : (
                <View style={styles.classPipSpacer} />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Less</Text>
        {([0, 1, 2, 3] as const).map((i) => (
          <View key={i} style={[styles.legendDot, { backgroundColor: INTENSITY_BG[i] }]} />
        ))}
        <Text style={styles.legendLabel}>More</Text>
        <View style={styles.legendSpacer} />
        <View style={[styles.classPip, styles.classAttended]} />
        <Text style={styles.legendLabel}>Class</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { gap: 8 },
  weekRow: { flexDirection: 'row' },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
  },
  weekdayClass: {
    color: light.accent,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 3,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFuture: {
    borderWidth: 1,
    borderColor: light.borderMuted,
    borderStyle: 'dashed',
  },
  dotToday: {
    borderWidth: 2,
    borderColor: light.text,
  },
  dayNum: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: light.textMuted,
  },
  dayNumOnDark: { color: '#FFFFFF' },
  dayNumFuture: { opacity: 0.4 },
  classPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 3,
  },
  classPipSpacer: { height: 9 },
  classAttended: { backgroundColor: light.accent },
  classMissed: { backgroundColor: light.border },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  legendLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: light.textMuted,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendSpacer: { flex: 1 },
});
