// Maqra review session — the repeat-listening workflow, plus the mistake
// highlighter used while reciting to a teacher.
//
// Loads a rub' al-hizb (possibly spanning two surahs), plays it with the
// user's repeat settings, highlights the ayah being recited, and offers the
// two range actions that matter: mark the whole portion memorized, or mark it
// reviewed today. Switching to Mark mistakes turns the text into a finger
// highlighter whose marks persist until the user clears them.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Highlighter, Pause, Play } from 'lucide-react-native';
import { RepeatControls } from '@components/audio/RepeatControls';
import { HighlightableAyah, type Selection } from '@components/mistakes/HighlightableAyah';
import { MistakeDock } from '@components/mistakes/MistakeDock';
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
import { expandToWord, marksForAyah, segmentArabic, sliceClusters } from '@core/mistakes';
import { qariById } from '@audio/sources';
import { unlockWebAudio } from '@audio/webAudio';
import { useMaqraPlayer } from '../../../hooks/useMaqraPlayer';
import { useActivityStore } from '@stores/activity';
import { useHifzStore } from '@stores/hifz';
import { useAudioPrefsStore } from '@stores/audioPrefs';
import { useMistakesStore } from '@stores/mistakes';
import { useSettingsStore } from '@stores/settings';
import { useUiStore } from '@stores/ui';
import { light } from '@theme/colors';
import { arabicSize } from '@theme/typography';

export default function MaqraSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { maqraId } = useLocalSearchParams<{ maqraId: string }>();
  const maqra = maqraById(Number(maqraId));

  const records = useHifzStore((s) => s.records);
  const applyRange = useHifzStore((s) => s.applyRange);
  const record = useActivityStore((s) => s.record);
  const fontScale = useSettingsStore((s) => s.fontScale);
  const qariId = useAudioPrefsStore((s) => s.qariId);
  const allMarks = useMistakesStore((s) => s.marks);
  const addMark = useMistakesStore((s) => s.addMark);
  const removeMark = useMistakesStore((s) => s.removeMark);
  const restoreLastRemoved = useMistakesStore((s) => s.restoreLastRemoved);
  const showToast = useUiStore((s) => s.showToast);
  const { playing, progress, playMaqra, stop } = useMaqraPlayer();

  const [marking, setMarking] = useState(false);
  const [target, setTarget] = useState<{ surah: number; ayah: number } | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);

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

  const targetText = target
    ? (ayat.find((a) => a.surah === target.surah && a.ayah === target.ayah)?.text ?? '')
    : '';
  const targetClusters = targetText ? segmentArabic(targetText) : [];
  const excerpt =
    selection && targetClusters.length
      ? sliceClusters(targetClusters, selection.from, selection.to)
      : '';

  const beginSelection = (surah: number, ayah: number, sel: Selection | null) => {
    setTarget(sel ? { surah, ayah } : null);
    setSelection(sel);
  };

  const saveMark = () => {
    if (!target || !selection) return;
    addMark({
      surah: target.surah,
      ayah: target.ayah,
      from: selection.from,
      to: selection.to,
      excerpt,
    });
    setSelection(null);
    setTarget(null);
  };

  const expandSelection = () => {
    if (!selection || targetClusters.length === 0) return;
    setSelection(expandToWord(targetClusters, selection.from, selection.to));
  };

  const dropMark = (id: string, text: string) => {
    removeMark(id);
    showToast({
      message: `Mistake cleared · ${text}`,
      actionLabel: 'Undo',
      onAction: () => restoreLastRemoved(),
    });
  };

  const maqraMarkCount = ayat.reduce(
    (n, a) => n + marksForAyah(allMarks, a.surah, a.ayah).length,
    0,
  );

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

          {!marking && <RepeatControls />}

          {!marking && (
            <Pressable
              onPress={() => router.push('/settings')}
              style={styles.reciterRow}
              accessibilityRole="button"
            >
              <Text style={styles.reciterLabel}>Reciter</Text>
              <Text style={styles.reciterName} numberOfLines={1}>
                {qariById(qariId).displayName}
              </Text>
              <Text style={styles.reciterChevron}>›</Text>
            </Pressable>
          )}

          {!marking && (
            <Pressable
              onPress={() => {
                setMarking(true);
                setSelection(null);
                setTarget(null);
                void stop();
              }}
              style={styles.markToggle}
              accessibilityRole="button"
            >
              <Highlighter size={16} color={light.text} />
              <Text style={styles.markToggleText}>Mark mistakes</Text>
              {maqraMarkCount > 0 ? (
                <View style={styles.markCount}>
                  <Text style={styles.markCountText}>{maqraMarkCount}</Text>
                </View>
              ) : null}
            </Pressable>
          )}

          <View style={styles.ayatBlock}>
            {ayat.map(({ surah, ayah, text }, i) => {
              const key = `${surah}:${ayah}`;
              const isCurrent = key === currentKey;
              const startsNewSurah = i === 0 || ayat[i - 1]!.surah !== surah;
              const ayahMarks = marksForAyah(allMarks, surah, ayah);
              const isTarget = target?.surah === surah && target?.ayah === ayah;
              return (
                <View key={key}>
                  {startsNewSurah && <Text style={styles.surahDivider}>{surahName(surah)}</Text>}
                  <View style={styles.ayahRow}>
                    <HighlightableAyah
                      ayahKey={key}
                      text={text}
                      fontSize={size}
                      marks={ayahMarks}
                      editing={marking}
                      playing={isCurrent && !marking}
                      selection={isTarget ? selection : null}
                      onSelectionChange={(sel) => beginSelection(surah, ayah, sel)}
                      onMarkPress={(m) => dropMark(m.id, m.excerpt || text.slice(0, 12))}
                      suffix={` ۝${toArabicDigits(ayah)} `}
                    />
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
        {marking ? (
          <MistakeDock
            excerpt={excerpt}
            canSave={selection !== null}
            savedCount={maqraMarkCount}
            onSave={saveMark}
            onExpandWord={expandSelection}
            onCancel={() => {
              setSelection(null);
              setTarget(null);
            }}
            onDone={() => {
              setMarking(false);
              setSelection(null);
              setTarget(null);
            }}
            hint="Drag across a word or letter. Tap a highlight to clear it."
          />
        ) : (
          <Pressable
            onPress={() => {
              // Synchronous, inside the gesture: iOS only unlocks the audio
              // element here, never in the async work that follows.
              unlockWebAudio();
              if (playing) void stop();
              else void playMaqra(maqra);
            }}
            style={styles.playBtn}
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Stop' : 'Play this maqra'}
          >
            {playing ? <Pause size={20} color="#FFFFFF" /> : <Play size={20} color="#FFFFFF" />}
            <Text style={styles.playLabel}>
              {playing ? 'Stop' : `Play ${maqra.ayahCount} ayat`}
            </Text>
          </Pressable>
        )}
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
  reciterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: light.surface,
    borderWidth: 1,
    borderColor: light.border,
    minHeight: 46,
  },
  reciterLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  reciterName: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.text,
    textAlign: 'right',
  },
  reciterChevron: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: light.border,
  },
  markToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 11,
    backgroundColor: light.surface,
    borderWidth: 1,
    borderColor: light.border,
    minHeight: 46,
  },
  markToggleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.text,
  },
  markCount: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 11,
    backgroundColor: light.state.learningBg,
    alignItems: 'center',
  },
  markCountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: light.state.learningMarker,
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
