// Maqra list — all 240 rub' al-hizb, grouped by juz so the list stays
// navigable. Rendered through FlashList because 240 rows with progress bars
// is past the point where a plain ScrollView stays smooth on a phone.

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrowseRow } from '@components/browse/BrowseRow';
import { MAX_CONTENT_WIDTH } from '@components/primitives/Screen';
import { MAQRAS, maqraProgress, maqraRangeLabel } from '@core/maqra';
import type { Maqra } from '@core/maqra/types';
import { useHifzStore } from '@stores/hifz';
import { light } from '@theme/colors';

type Row = { kind: 'header'; juz: number } | { kind: 'maqra'; maqra: Maqra };

export default function MaqraListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const records = useHifzStore((s) => s.records);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let currentJuz = 0;
    for (const maqra of MAQRAS) {
      if (maqra.juz !== currentJuz) {
        currentJuz = maqra.juz;
        out.push({ kind: 'header', juz: currentJuz });
      }
      out.push({ kind: 'maqra', maqra });
    }
    return out;
  }, []);

  return (
    <View style={[styles.host, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.back} onPress={() => router.back()}>
          ‹
        </Text>
        <View>
          <Text style={styles.title}>Maqra</Text>
          <Text style={styles.subtitle}>{MAQRAS.length} quarters · about 26 ayat each</Text>
        </View>
      </View>

      <FlashList
        data={rows}
        keyExtractor={(row) => (row.kind === 'header' ? `h${row.juz}` : `m${row.maqra.id}`)}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 40,
        }}
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return <Text style={styles.sectionLabel}>Juz {item.juz}</Text>;
          }
          const p = maqraProgress(item.maqra, records);
          return (
            <View style={styles.rowWrap}>
              <BrowseRow
                badge={item.maqra.id}
                title={maqraRangeLabel(item.maqra)}
                subtitle={`Hizb ${item.maqra.hizb} · Rub' ${item.maqra.quarterInHizb} · ${item.maqra.ayahCount} ayat`}
                percent={p.percent}
                learningPercent={(p.learning / p.total) * 100}
                meta={`${p.memorized} / ${p.total}`}
                onPress={() => router.push(`/browse/maqra/${item.maqra.id}` as never)}
              />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: light.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  back: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    lineHeight: 32,
    color: light.text,
    paddingRight: 6,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: light.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: light.textMuted,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  rowWrap: {
    marginBottom: 10,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
});
