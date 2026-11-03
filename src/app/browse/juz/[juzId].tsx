// One juz — its hizbs, each expanded into its four maqras.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrowseRow } from '@components/browse/BrowseRow';
import { Screen } from '@components/primitives/Screen';
import { ProgressBar } from '@components/primitives/ProgressBar';
import {
  combinedProgress,
  hizbsInJuz,
  maqraProgress,
  maqraRangeLabel,
  maqrasInHizb,
  maqrasInJuz,
} from '@core/maqra';
import { maqraMistakeCount } from '@core/mistakes';
import { useHifzStore } from '@stores/hifz';
import { useMistakesStore } from '@stores/mistakes';
import { light } from '@theme/colors';

export default function JuzDetailScreen() {
  const router = useRouter();
  const { juzId } = useLocalSearchParams<{ juzId: string }>();
  const juz = Number(juzId) || 1;
  const records = useHifzStore((s) => s.records);
  const marks = useMistakesStore((s) => s.marks);

  const { hizbs, overall } = useMemo(() => {
    const all = maqrasInJuz(juz);
    return {
      hizbs: hizbsInJuz(juz).map((hizb) => ({
        hizb,
        maqras: maqrasInHizb(hizb),
      })),
      overall: combinedProgress(all, records),
    };
  }, [juz, records]);

  return (
    <Screen title={`Juz ${juz}`} subtitle={`${overall.total} ayat`}>
      <View style={styles.summary}>
        <Text style={styles.summaryValue}>
          {overall.memorized}
          <Text style={styles.summaryMuted}> / {overall.total} memorized</Text>
        </Text>
        <ProgressBar
          percent={overall.percent}
          learningPercent={(overall.learning / overall.total) * 100}
          height={8}
        />
      </View>

      {hizbs.map(({ hizb, maqras }) => (
        <View key={hizb} style={{ gap: 10 }}>
          <Text style={styles.sectionLabel}>Hizb {hizb}</Text>
          {maqras.map((maqra) => {
            const p = maqraProgress(maqra, records);
            return (
              <BrowseRow
                key={maqra.id}
                badge={maqra.id}
                title={maqraRangeLabel(maqra)}
                subtitle={`Rub' ${maqra.quarterInHizb} · ${maqra.ayahCount} ayat`}
                percent={p.percent}
                learningPercent={(p.learning / p.total) * 100}
                meta={`${p.memorized} / ${p.total}`}
                mistakes={maqraMistakeCount(marks, maqra)}
                onPress={() => router.push(`/browse/maqra/${maqra.id}` as never)}
              />
            );
          })}
        </View>
      ))}
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
    fontSize: 20,
    color: light.text,
  },
  summaryMuted: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: light.textMuted,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 6,
  },
});
