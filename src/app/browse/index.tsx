// Browse hub — the single entry point to every way of finding a portion.
// Four doors, never more: Juz, Hizb, Maqra, Surah.

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@components/primitives/ProgressBar';
import { Screen } from '@components/primitives/Screen';
import { MAQRAS, TOTAL_HIZBS, TOTAL_JUZ, combinedProgress } from '@core/maqra';
import { useHifzStore } from '@stores/hifz';
import { light } from '@theme/colors';

interface Door {
  href: string;
  label: string;
  detail: string;
}

const DOORS: Door[] = [
  { href: '/browse/juz', label: 'Juz', detail: `${TOTAL_JUZ} parts` },
  { href: '/browse/hizb', label: 'Hizb', detail: `${TOTAL_HIZBS} halves` },
  { href: '/browse/maqra', label: 'Maqra', detail: `${MAQRAS.length} quarters` },
  { href: '/surahs', label: 'Surah', detail: '114 chapters' },
];

export default function BrowseScreen() {
  const router = useRouter();
  const records = useHifzStore((s) => s.records);
  const overall = combinedProgress(MAQRAS, records);

  return (
    <Screen title="Browse" subtitle="Pick a portion to read or review">
      <View style={styles.summary}>
        <Text style={styles.summaryValue}>
          {overall.memorized.toLocaleString('en-US')}
          <Text style={styles.summaryMuted}> / {overall.total.toLocaleString('en-US')} ayat</Text>
        </Text>
        <ProgressBar
          percent={overall.percent}
          learningPercent={(overall.learning / overall.total) * 100}
          height={8}
        />
      </View>

      <View style={styles.grid}>
        {DOORS.map((door) => (
          <Pressable
            key={door.href}
            onPress={() => router.push(door.href as never)}
            style={({ pressed }) => [styles.door, pressed && styles.doorPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.doorLabel}>{door.label}</Text>
            <Text style={styles.doorDetail}>{door.detail}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    padding: 16,
    gap: 10,
  },
  summaryValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: light.text,
  },
  summaryMuted: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: light.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  door: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 140,
    backgroundColor: light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    paddingVertical: 22,
    paddingHorizontal: 18,
    gap: 4,
  },
  doorPressed: {
    backgroundColor: light.surfaceMuted,
  },
  doorLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: light.text,
  },
  doorDetail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: light.textMuted,
  },
});
