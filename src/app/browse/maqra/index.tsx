// Maqra list — all 240 rub' al-hizb, grouped by juz so the list stays
// navigable. Rendered through FlashList because 240 rows with progress bars
// is past the point where a plain ScrollView stays smooth on a phone.

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrowseRow } from '@components/browse/BrowseRow';
import { MAX_CONTENT_WIDTH } from '@components/primitives/Screen';
import { MAQRAS, maqraProgress, maqraRangeLabel } from '@core/maqra';
import type { Maqra } from '@core/maqra/types';
import { maqraMistakeCount } from '@core/mistakes';
import { useHifzStore } from '@stores/hifz';
import { useMistakesStore } from '@stores/mistakes';
import { light } from '@theme/colors';

type Row = { kind: 'header'; juz: number } | { kind: 'maqra'; maqra: Maqra };

export default function MaqraListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const records = useHifzStore((s) => s.records);
  const marks = useMistakesStore((s) => s.marks);
  const [filters, setFilters] = useState({ mistakes: false, unfinished: false });

  // Counted once per render rather than per row: 240 rows x a full scan of the
  // mark log would be the one thing that makes this list stutter.
  const mistakeByMaqra = useMemo(() => {
    const map = new Map<number, number>();
    if (marks.length === 0) return map;
    for (const maqra of MAQRAS) {
      const n = maqraMistakeCount(marks, maqra);
      if (n > 0) map.set(maqra.id, n);
    }
    return map;
  }, [marks]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let currentJuz = 0;
    let pendingHeader: Row | null = null;

    for (const maqra of MAQRAS) {
      if (filters.mistakes && !mistakeByMaqra.has(maqra.id)) continue;
      if (filters.unfinished && maqraProgress(maqra, records).percent >= 100) continue;

      if (maqra.juz !== currentJuz) {
        currentJuz = maqra.juz;
        pendingHeader = { kind: 'header', juz: currentJuz };
      }
      if (pendingHeader) {
        out.push(pendingHeader);
        pendingHeader = null;
      }
      out.push({ kind: 'maqra', maqra });
    }
    return out;
  }, [filters, mistakeByMaqra, records]);

  const totalMistakes = [...mistakeByMaqra.values()].reduce((a, b) => a + b, 0);
  const maqrasWithMistakes = mistakeByMaqra.size;

  return (
    <View style={[styles.host, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.back} onPress={() => router.back()}>
          ‹
        </Text>
        <View>
          <Text style={styles.title}>Maqra</Text>
          <Text style={styles.subtitle}>
            {filters.mistakes || filters.unfinished
              ? `${rows.filter((r) => r.kind === 'maqra').length} shown`
              : `${MAQRAS.length} quarters · about 26 ayat each`}
          </Text>
        </View>
      </View>

      <View style={styles.filterBar}>
        <Pressable
          onPress={() => setFilters((f) => ({ ...f, mistakes: !f.mistakes }))}
          style={[styles.chip, filters.mistakes && styles.chipActive]}
          accessibilityRole="switch"
          accessibilityState={{ checked: filters.mistakes }}
        >
          <Text style={[styles.chipText, filters.mistakes && styles.chipTextActive]}>
            With mistakes{maqrasWithMistakes > 0 ? ` · ${maqrasWithMistakes}` : ''}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilters((f) => ({ ...f, unfinished: !f.unfinished }))}
          style={[styles.chip, filters.unfinished && styles.chipActive]}
          accessibilityRole="switch"
          accessibilityState={{ checked: filters.unfinished }}
        >
          <Text style={[styles.chipText, filters.unfinished && styles.chipTextActive]}>
            Not yet memorized
          </Text>
        </Pressable>
      </View>

      <FlashList
        data={rows}
        keyExtractor={(row) => (row.kind === 'header' ? `h${row.juz}` : `m${row.maqra.id}`)}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 40,
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {filters.mistakes && totalMistakes === 0
              ? 'No mistakes marked yet. Open a maqra and tap Mark mistakes while you recite.'
              : 'Nothing matches those filters.'}
          </Text>
        }
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
                mistakes={mistakeByMaqra.get(item.maqra.id) ?? 0}
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
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: light.surface,
    borderWidth: 1,
    borderColor: light.border,
    minHeight: 38,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: light.accent,
    borderColor: light.accent,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: light.text,
  },
  chipTextActive: { color: '#FFFFFF' },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: light.textMuted,
    textAlign: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
