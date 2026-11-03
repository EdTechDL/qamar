// Juz list — 30 rows, each opening its hizbs and maqras.

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { BrowseRow } from '@components/browse/BrowseRow';
import { Screen } from '@components/primitives/Screen';
import { TOTAL_JUZ, combinedProgress, maqraRangeLabel, maqrasInJuz } from '@core/maqra';
import { combinedMistakeCount } from '@core/mistakes';
import { useHifzStore } from '@stores/hifz';
import { useMistakesStore } from '@stores/mistakes';

export default function JuzListScreen() {
  const router = useRouter();
  const records = useHifzStore((s) => s.records);
  const marks = useMistakesStore((s) => s.marks);

  const rows = useMemo(
    () =>
      Array.from({ length: TOTAL_JUZ }, (_, i) => {
        const juz = i + 1;
        const maqras = maqrasInJuz(juz);
        const progress = combinedProgress(maqras, records);
        const first = maqras[0];
        const last = maqras[maqras.length - 1];
        const span =
          first && last
            ? `${maqraRangeLabel(first).split('–')[0]!.trim()} → ${maqraRangeLabel(last).split(/–| – /).pop()!.trim()}`
            : '';
        return { juz, progress, span, mistakes: combinedMistakeCount(marks, maqras) };
      }),
    [records, marks],
  );

  return (
    <Screen title="Juz" subtitle={`${TOTAL_JUZ} parts of the mushaf`}>
      <View style={{ gap: 10 }}>
        {rows.map(({ juz, progress, span, mistakes }) => (
          <BrowseRow
            key={juz}
            badge={juz}
            title={`Juz ${juz}`}
            subtitle={span}
            percent={progress.percent}
            learningPercent={(progress.learning / progress.total) * 100}
            meta={`${progress.memorized} / ${progress.total}`}
            mistakes={mistakes}
            onPress={() => router.push(`/browse/juz/${juz}` as never)}
          />
        ))}
      </View>
    </Screen>
  );
}
