// Maqra review session — the repeat-listening workflow.
//
// Loads a rub' al-hizb (possibly spanning two surahs), plays it with the
// user's repeat settings, highlights the ayah being recited, and offers the
// two range actions that matter: mark the whole portion memorized, or mark it
// reviewed today.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pause, Play } from 'lucide-react-native';
import { RepeatControls } from '@components/audio/RepeatControls';
import { ProgressBar } from '@components/primitives/ProgressBar';
import { MAX_CONTENT_WIDTH } from '@components/primitives/Screen';
import { loadSurah } from '@content/text';
import {
  maqraAyahs,
  maqraById,
  maqraPositionLabel,
  maqraProgress,
  maqraRangeLabel,
  surahName,
} from '@core/maqra';
import { useMaqraPlayer } from '../../../hooks/useMaqraPlayer';
import { useActivityStore } from '@stores/activity';
import { useHifzStore } from '@stores/hifz';
import { useSettingsStore } from '@stores/settings';
import { light } from '@theme/colors';
import { arabicLineHeight, arabicSize } from '@theme/typography';

export default function MaqraSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { maqraId } = useLocalSearchParams<{ maqraId: string }>();
  const maqra = maqraById(Number(maqraId));

  const records = useHifzStore((s) => s.records);
  const applyRange = useHifzStore((s) => s.applyRange);
  const record = useActivityStore((s) => s.record);
  const fontScale = useSettingsStore((s) => s.fontScale);
  const { playing, progress, playMaqra, stop } = useMaqraPlayer();

  const size = arabicSize(fontScale);

  // Stop playback when the screen goes away — nothing is more jarring than
  // audio that follows you back to the list.
  useEffect(() => () => void stop(), [stop]);

  const ayat = useMemo(() => {
    if (!maqra) return [];
    // Cache per surah: a maqra is at most two surahs, but it is up to 86 ayat.
    const bySurah = new Map<number, ReturnType<typeof loadSurah>>();
    return maqraAyahs(maqra).map(({ surah, ayah }) => {
      if (!bySurah.has(surah)) bySurah.set(surah, loadSurah(surah));
      const text = bySurah.get(surah)?.find((a) => a.ayah === ayah)?.text ?? '';
      return { surah, ayah, text };
    });
  }, [maqra]);

  if (!maqra) {
    return (
      <View style={[styles.host, styles.centered]}>
        <Text style={styles.missing}>That maqra does not exist.</Text>
        <Pressable onPress={() => router.replace('/browse/maqra')} style={styles.ghostBtn}>
          <Text style={styles.ghostBtnText}>Back to the list</Text>
        </Pressable>
      </View>
    );
  }

  const p = maqraProgress(maqra, records);

  const markAll = (target: 'memorized' | 'none') => {
    for (const seg of maqra.segments) {
      applyRange(seg.surah, seg.from, seg.to, target);
    }
    record('ayatMarked', maqra.ayahCount);
  };

  const currentKey = progress ? `${progress.surah}:${progress.ayah}` : null;

  return (
    <View style={[styles.host, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 180,
          alignItems: 'center',
        }}
      >
        <View style={styles.inner}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={14}>
              <Text style={styles.back}>‹</Text>
            </Pressable>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.title} numberOfLines={2}>
                {maqraRangeLabel(maqra)}
              </Text>
              <Text style={styles.subtitle}>{maqraPositionLabel(maqra)}</Text>
            </View>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusValue}>
                {p.memorized}
                <Text style={styles.statusMuted}> / {p.total} memorized</Text>
              </Text>
              {progress ? (
                <Text style={styles.nowPlaying}>
                  {surahName(progress.surah)} {progress.ayah}
                  {progress.ayahRepeat > 1 && progress.ayahRepeat !== Infinity
                    ? ` · ${progress.repeat}/${progress.ayahRepeat}`
                    : ''}
                </Text>
              ) : null}
            </View>
            <ProgressBar
              percent={p.percent}
              learningPercent={(p.learning / p.total) * 100}
              height={8}
            />
            {progress ? (
              <Text style={styles.passLine}>
                Ayah {progress.index + 1} of {progress.total}
                {progress.setRepeat > 1
                  ? ` · pass ${progress.pass}${
                      progress.setRepeat === Infinity ? '' : `/${progress.setRepeat}`
                    }`
                  : ''}
              </Text>
            ) : null}
          </View>

          <RepeatControls />

          <View style={styles.ayatBlock}>
            {ayat.map(({ surah, ayah, text }, i) => {
              const key = `${surah}:${ayah}`;
              const isCurrent = key === currentKey;
              const startsNewSurah = i === 0 || ayat[i - 1]!.surah !== surah;
              return (
                <View key={key}>
                  {startsNewSurah && <Text style={styles.surahDivider}>{surahName(surah)}</Text>}
                  <View style={[styles.ayahRow, isCurrent && styles.ayahRowActive]}>
                    <Text
                      style={[
                        styles.arabic,
                        { fontSize: size, lineHeight: arabicLineHeight(size) },
                      ]}
                    >
                      {text}
                      <Text style={styles.marker}> ۝{toArabicDigits(ayah)} </Text>
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => markAll('memorized')}
              style={[styles.actionBtn, styles.actionPrimary]}
            >
              <Text style={styles.actionPrimaryText}>Mark maqra memorized</Text>
            </Pressable>
            <Pressable onPress={() => markAll('none')} style={styles.actionBtn}>
              <Text style={styles.actionText}>Clear</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.dock, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          onPress={() => (playing ? void stop() : void playMaqra(maqra))}
          style={styles.playBtn}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Stop' : 'Play this maqra'}
        >
          {playing ? <Pause size={20} color="#FFFFFF" /> : <Play size={20} color="#FFFFFF" />}
          <Text style={styles.playLabel}>{playing ? 'Stop' : `Play ${maqra.ayahCount} ayat`}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArabicDigits(n: number): string {
  return n
    .toString()
    .split('')
    .map((d) => ARABIC_DIGITS[Number(d)] ?? d)
    .join('');
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: light.bg },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  missing: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: light.text,
  },
  ghostBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: light.border,
  },
  ghostBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.text,
  },
  inner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    lineHeight: 32,
    color: light.text,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, color: light.text },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    color: light.textMuted,
    marginTop: 1,
  },
  statusCard: {
    backgroundColor: light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    padding: 14,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: light.text,
  },
  statusMuted: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: light.textMuted,
  },
  nowPlaying: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12.5,
    color: light.state.playingMarker,
  },
  passLine: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: light.textMuted,
  },
  ayatBlock: { gap: 6 },
  surahDivider: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 4,
  },
  ayahRow: {
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  ayahRowActive: {
    backgroundColor: light.state.playingBg,
  },
  arabic: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: light.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  marker: {
    color: light.accentSecondary,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.surface,
    borderWidth: 1,
    borderColor: light.border,
    minHeight: 48,
  },
  actionPrimary: {
    flex: 2,
    backgroundColor: light.accent,
    borderColor: light.accent,
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.text,
  },
  actionPrimaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: light.bg,
    borderTopWidth: 1,
    borderTopColor: light.border,
    alignItems: 'center',
  },
  playBtn: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: light.accent,
    borderRadius: 14,
    paddingVertical: 17,
    minHeight: 54,
  },
  playLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
