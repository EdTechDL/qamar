// Streak display. Deliberately gentle: a rest day reads as a rest day, not a
// failure, and nothing here ever counts what was missed (SPEC §15.4).

import { StyleSheet, Text, View } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useStreak } from '../../hooks/useActivity';
import { light } from '@theme/colors';

function streakCopy(current: number, activeToday: boolean, usingGrace: boolean): string {
  if (current === 0) return 'Open any surah to begin';
  if (activeToday) return current === 1 ? 'Started today' : 'Kept going today';
  if (usingGrace) return 'Rest day — your streak is safe';
  return 'Pick it back up whenever';
}

export function StreakCard() {
  const { current, longest, activeToday, usingGrace } = useStreak();
  const lit = current > 0;

  return (
    <View style={styles.card}>
      <View style={[styles.flame, lit && styles.flameLit]}>
        <Flame
          size={20}
          color={lit ? '#FFFFFF' : light.textMuted}
          fill={activeToday ? '#FFFFFF' : 'transparent'}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.value}>
          {current}
          <Text style={styles.unit}> {current === 1 ? 'day' : 'days'}</Text>
        </Text>
        <Text style={styles.copy}>{streakCopy(current, activeToday, usingGrace)}</Text>
      </View>

      {longest > 0 && (
        <View style={styles.best}>
          <Text style={styles.bestLabel}>Best</Text>
          <Text style={styles.bestValue}>{longest}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    padding: 16,
  },
  flame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.surfaceMuted,
    borderWidth: 1,
    borderColor: light.border,
  },
  flameLit: {
    backgroundColor: light.accentSecondary,
    borderColor: light.accentSecondary,
  },
  body: { flex: 1 },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: light.text,
  },
  unit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: light.textMuted,
  },
  copy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: light.textMuted,
    marginTop: 1,
  },
  best: {
    alignItems: 'center',
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: light.borderMuted,
  },
  bestLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bestValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: light.text,
  },
});
