// One hizb — its four maqras.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { BrowseRow } from '@components/browse/BrowseRow';
import { Screen } from '@components/primitives/Screen';
import { combinedProgress, maqraProgress, maqraRangeLabel, maqrasInHizb } from '@core/maqra';
import { useHifzStore } from '@stores/hifz';

export default function HizbDetailScreen() {
  const router = useRouter();
  const { hizbId } = useLocalSearchParams<{ hizbId: string }>();
  const hizb = Number(hizbId) || 1;
  const records = useHifzStore((s) => s.records);

  const { maqras, overall } = useMemo(() => {
    const list = maqrasInHizb(hizb);
    return { maqras: list, overall: combinedProgress(list, records) };
  }, [hizb, records]);

  const juz = maqras[0]?.juz;

  return (
    <Screen
      title={`Hizb ${hizb}`}
      subtitle={`${juz ? `Juz ${juz} · ` : ''}${overall.memorized} / ${overall.total} memorized`}
    >
      <View style={{ gap: 10 }}>
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
              onPress={() => router.push(`/browse/maqra/${maqra.id}` as never)}
            />
          );
        })}
      </View>
    </Screen>
  );
}
