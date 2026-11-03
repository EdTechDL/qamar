// Monthly connection with the Quran — calendar, totals, class attendance.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@components/primitives/Screen';
import { MonthCalendar } from '@components/tracking/MonthCalendar';
import { StreakCard } from '@components/tracking/StreakCard';
import { dayKey } from '@core/activity';
import { useMonthSummary } from '../hooks/useActivity';
import { light } from '@theme/colors';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y ?? 1970, (m ?? 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTH_NAMES[(m ?? 1) - 1]} ${y}`;
}

export default function ProgressScreen() {
  const thisMonth = dayKey(new Date()).slice(0, 7);
  const [month, setMonth] = useState(thisMonth);
  const summary = useMonthSummary(month);
  const atCurrent = month >= thisMonth;

  const stats = useMemo(
    () => [
      { label: 'Days connected', value: `${summary.activeDays}`, of: `of ${summary.daysInMonth}` },
      { label: 'Ayat marked', value: summary.ayatMarked.toLocaleString('en-US') },
      { label: 'Ayat heard', value: summary.ayatListened.toLocaleString('en-US') },
      { label: 'Maqras reviewed', value: `${summary.maqrasReviewed}` },
    ],
    [summary],
  );

  return (
    <Screen title="Progress" subtitle="Your month with the Quran">
      <StreakCard />

      <View style={styles.card}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => setMonth(shiftMonth(month, -1))} hitSlop={12}>
            <Text style={styles.nav}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel(month)}</Text>
          <Pressable
            onPress={() => !atCurrent && setMonth(shiftMonth(month, 1))}
            hitSlop={12}
            disabled={atCurrent}
          >
            <Text style={[styles.nav, atCurrent && styles.navDisabled]}>›</Text>
          </Pressable>
        </View>

        <Text style={styles.headline}>
          {summary.activeDays}
          <Text style={styles.headlineMuted}>
            {' '}
            / {summary.daysInMonth} days · {summary.percent.toFixed(0)}%
          </Text>
        </Text>

        <MonthCalendar month={month} />
      </View>

      <View style={styles.statGrid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statValue}>
              {s.value}
              {s.of ? <Text style={styles.statOf}> {s.of}</Text> : null}
            </Text>
          </View>
        ))}
      </View>

      {summary.classesAttended + summary.classesMissed > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Class attendance</Text>
          <Text style={styles.headline}>
            {summary.classesAttended}
            <Text style={styles.headlineMuted}>
              {' '}
              of {summary.classesAttended + summary.classesMissed} attended
            </Text>
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    padding: 16,
    gap: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: light.text,
  },
  nav: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 26,
    color: light.text,
    paddingHorizontal: 10,
  },
  navDisabled: { opacity: 0.25 },
  headline: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: light.text,
  },
  headlineMuted: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: light.textMuted,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 140,
    backgroundColor: light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    padding: 14,
    gap: 3,
  },
  statLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: light.text,
  },
  statOf: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: light.textMuted,
  },
});
