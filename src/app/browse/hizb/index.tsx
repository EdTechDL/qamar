// Hizb list — 60 rows, each opening its four maqras.

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { BrowseRow } from '@components/browse/BrowseRow';
import { Screen } from '@components/primitives/Screen';
import { TOTAL_HIZBS, combinedProgress, maqraRangeLabel, maqrasInHizb } from '@core/maqra';
import { combinedMistakeCount } from '@core/mistakes';
import { useHifzStore } from '@stores/hifz';
import { useMistakesStore } from '@stores/mistakes';

export default function HizbListScreen() {
  const router = useRouter();
  const records = useHifzStore((s) => s.records);
  const marks = useMistakesStore((s) => s.marks);

  const rows = useMemo(
    () =>
      Array.from({ length: TOTAL_HIZBS }, (_, i) => {
        const hizb = i + 1;
        const maqras = maqrasInHizb(hizb);
        const first = maqras[0];
        return {
          hizb,
          juz: first?.juz ?? Math.ceil(hizb / 2),
          progress: combinedProgress(maqras, records),
          span: first ? maqraRangeLabel(first).split('–')[0]!.trim() : '',
          mistakes: combinedMistakeCount(marks, maqras),
        };
      }),
    [records, marks],
  );

  return (
    <Screen title="Hizb" subtitle={`${TOTAL_HIZBS} halves · 4 maqras each`}>
      <View style={{ gap: 10 }}>
        {rows.map(({ hizb, juz, progress, span, mistakes }) => (
          <BrowseRow
            key={hizb}
            badge={hizb}
            title={`Hizb ${hizb}`}
            subtitle={`Juz ${juz} · from ${span}`}
            percent={progress.percent}
            learningPercent={(progress.learning / progress.total) * 100}
            meta={`${progress.memorized} / ${progress.total}`}
            mistakes={mistakes}
            onPress={() => router.push(`/browse/hizb/${hizb}` as never)}
          />
        ))}
      </View>
    </Screen>
  );
}
