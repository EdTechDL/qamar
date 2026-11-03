import { loadSurah } from '@content/text';
import { maqraById } from '@core/maqra';
import {
  coveredClusters,
  combinedMistakeCount,
  expandToWord,
  groupByAyah,
  isSpaceCluster,
  markAt,
  maqraMistakeCount,
  marksForAyah,
  segmentArabic,
  sliceClusters,
  surahMistakeCount,
  wordRanges,
  type MistakeMark,
} from '@core/mistakes';

const BASMALAH = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

const mark = (
  over: Partial<MistakeMark> & Pick<MistakeMark, 'surah' | 'ayah' | 'from' | 'to'>,
): MistakeMark => ({
  id: `${over.surah}:${over.ayah}:${over.from}-${over.to}`,
  excerpt: '',
  createdAt: '2026-11-03T00:00:00.000Z',
  ...over,
});

describe('segmentArabic', () => {
  it('round-trips exactly', () => {
    expect(segmentArabic(BASMALAH).join('')).toBe(BASMALAH);
  });

  it('keeps a harakah attached to its letter', () => {
    const clusters = segmentArabic(BASMALAH);
    expect(clusters.slice(0, 3)).toEqual(['بِ', 'سْ', 'مِ']);
  });

  it('keeps shadda and a vowel on the same letter', () => {
    // lam + shadda + fatha
    const clusters = segmentArabic('لَّ');
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toBe('لَّ');
  });

  it('keeps the superscript alef attached', () => {
    const clusters = segmentArabic('مَٰ');
    expect(clusters).toHaveLength(1);
  });

  it('treats a space as its own cluster', () => {
    const clusters = segmentArabic('مِ ا');
    expect(clusters).toEqual(['مِ', ' ', 'ا']);
    expect(isSpaceCluster(clusters[1]!)).toBe(true);
    expect(isSpaceCluster(clusters[0]!)).toBe(false);
  });

  it('never starts a cluster with a combining mark', () => {
    // A stray leading harakah has nothing to attach to; it must not be lost.
    expect(segmentArabic('َب').join('')).toBe('َب');
  });

  it('handles the empty string', () => {
    expect(segmentArabic('')).toEqual([]);
  });

  it('segments every ayah of Al-Fatiha without losing a character', () => {
    for (const { text } of loadSurah(1) ?? []) {
      expect(segmentArabic(text).join('')).toBe(text);
    }
  });

  it('produces fewer clusters than code points for voweled text', () => {
    const clusters = segmentArabic(BASMALAH);
    expect(clusters.length).toBeLessThan([...BASMALAH].length);
  });
});

describe('word helpers', () => {
  const clusters = segmentArabic(BASMALAH);

  it('finds the word ranges', () => {
    const words = wordRanges(clusters);
    expect(words).toHaveLength(4); // bismi / Allahi / ar-Rahmani / ar-Rahim
    expect(words[0]!.from).toBe(0);
  });

  it('expands a single cluster to its whole word', () => {
    const words = wordRanges(clusters);
    const second = words[1]!;
    const inside = second.from + 1;
    expect(expandToWord(clusters, inside, inside)).toEqual(second);
  });

  it('expands a reversed selection too', () => {
    expect(expandToWord(clusters, 2, 0)).toEqual(wordRanges(clusters)[0]);
  });

  it('clamps at the ends', () => {
    const last = wordRanges(clusters).at(-1)!;
    expect(expandToWord(clusters, clusters.length - 1, clusters.length - 1)).toEqual(last);
  });

  it('slices back to readable text', () => {
    const first = wordRanges(clusters)[0]!;
    expect(sliceClusters(clusters, first.from, first.to)).toBe('بِسْمِ');
  });

  it('clamps an out-of-range slice', () => {
    expect(sliceClusters(clusters, -5, 1_000)).toBe(BASMALAH);
  });
});

describe('mistake queries', () => {
  const marks: MistakeMark[] = [
    mark({ surah: 1, ayah: 1, from: 0, to: 2 }),
    mark({ surah: 1, ayah: 1, from: 8, to: 9 }),
    mark({ surah: 1, ayah: 2, from: 0, to: 1 }),
    mark({ surah: 114, ayah: 6, from: 0, to: 0 }),
  ];

  it('groups by ayah', () => {
    const grouped = groupByAyah(marks);
    expect(grouped.get('1:1')).toHaveLength(2);
    expect(grouped.get('1:2')).toHaveLength(1);
    expect(grouped.get('9:9')).toBeUndefined();
  });

  it('filters per ayah', () => {
    expect(marksForAyah(marks, 1, 1)).toHaveLength(2);
    expect(marksForAyah(marks, 1, 3)).toHaveLength(0);
  });

  it('counts per surah', () => {
    expect(surahMistakeCount(marks, 1)).toBe(3);
    expect(surahMistakeCount(marks, 114)).toBe(1);
    expect(surahMistakeCount(marks, 2)).toBe(0);
  });

  it('counts per maqra', () => {
    const first = maqraById(1)!; // starts at Al-Fatiha
    const last = maqraById(240)!; // ends at An-Nas
    expect(maqraMistakeCount(marks, first)).toBe(3);
    expect(maqraMistakeCount(marks, last)).toBe(1);
  });

  it('counts across several maqras without double counting', () => {
    const both = [maqraById(1)!, maqraById(240)!];
    expect(combinedMistakeCount(marks, both)).toBe(4);
  });

  it('short-circuits on an empty log', () => {
    expect(maqraMistakeCount([], maqraById(1)!)).toBe(0);
    expect(combinedMistakeCount([], [maqraById(1)!])).toBe(0);
  });

  it('finds the mark under a cluster', () => {
    const ayahMarks = marksForAyah(marks, 1, 1);
    expect(markAt(ayahMarks, 1)?.from).toBe(0);
    expect(markAt(ayahMarks, 9)?.from).toBe(8);
    expect(markAt(ayahMarks, 5)).toBeUndefined();
  });

  it('expands marks to the covered cluster set', () => {
    const covered = coveredClusters(marksForAyah(marks, 1, 1));
    expect([...covered].sort((a, b) => a - b)).toEqual([0, 1, 2, 8, 9]);
  });
});
