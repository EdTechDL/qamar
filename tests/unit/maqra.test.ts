import ayahIndexJson from '@content/ayah-index.json';
import structure from '@content/structure.json';
import type { SurahMeta } from '@content/types';
import type { AyahIndex, AyahRecord } from '@core/hifz/types';
import {
  MAQRAS,
  TOTAL_MAQRAS,
  combinedProgress,
  hizbsInJuz,
  maqraAyahs,
  maqraById,
  maqraForAyah,
  maqraProgress,
  maqraRangeLabel,
  maqrasInHizb,
  maqrasInJuz,
} from '@core/maqra';

const AYAH_INDEX = ayahIndexJson as AyahIndex;
const SURAHS = structure as SurahMeta[];
const TOTAL_AYAHS = 6236;

describe('maqra derivation', () => {
  it('produces exactly 240 maqras', () => {
    expect(MAQRAS).toHaveLength(TOTAL_MAQRAS);
    expect(MAQRAS.map((m) => m.id)).toEqual(Array.from({ length: TOTAL_MAQRAS }, (_, i) => i + 1));
  });

  it('covers all 6,236 ayat exactly once', () => {
    const seen = new Set<string>();
    let count = 0;
    for (const maqra of MAQRAS) {
      for (const { surah, ayah } of maqraAyahs(maqra)) {
        const key = `${surah}:${ayah}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        count += 1;
      }
    }
    expect(count).toBe(TOTAL_AYAHS);
    expect(seen.size).toBe(TOTAL_AYAHS);
  });

  it('agrees with the bundled ayah-index on every ayah', () => {
    for (const maqra of MAQRAS) {
      for (const { surah, ayah } of maqraAyahs(maqra)) {
        expect(AYAH_INDEX[`${surah}:${ayah}`]?.hizbQuarter).toBe(maqra.id);
      }
    }
  });

  it('keeps ayahCount in sync with its segments', () => {
    for (const maqra of MAQRAS) {
      expect(maqra.ayahCount).toBe(maqraAyahs(maqra).length);
      expect(maqra.ayahCount).toBeGreaterThan(0);
    }
  });

  it('derives hizb and quarter positionally', () => {
    expect(maqraById(1)).toMatchObject({ juz: 1, hizb: 1, quarterInHizb: 1 });
    expect(maqraById(4)).toMatchObject({ hizb: 1, quarterInHizb: 4 });
    expect(maqraById(5)).toMatchObject({ hizb: 2, quarterInHizb: 1 });
    expect(maqraById(240)).toMatchObject({ juz: 30, hizb: 60, quarterInHizb: 4 });
  });

  it('builds ascending, non-overlapping segments', () => {
    for (const maqra of MAQRAS) {
      let prevSurah = 0;
      for (const seg of maqra.segments) {
        expect(seg.from).toBeLessThanOrEqual(seg.to);
        expect(seg.surah).toBeGreaterThanOrEqual(prevSurah);
        const meta = SURAHS.find((s) => s.id === seg.surah);
        expect(meta).toBeDefined();
        expect(seg.to).toBeLessThanOrEqual(meta!.ayahCount);
        prevSurah = seg.surah;
      }
    }
  });

  it('rejects out-of-range ids', () => {
    expect(maqraById(0)).toBeUndefined();
    expect(maqraById(241)).toBeUndefined();
    expect(maqraById(1.5)).toBeUndefined();
  });
});

describe('maqra grouping', () => {
  it('splits into 30 juz covering every maqra', () => {
    let total = 0;
    for (let juz = 1; juz <= 30; juz++) {
      const inJuz = maqrasInJuz(juz);
      expect(inJuz.length).toBeGreaterThan(0);
      total += inJuz.length;
    }
    expect(total).toBe(TOTAL_MAQRAS);
  });

  it('puts exactly 4 maqras in every hizb', () => {
    for (let hizb = 1; hizb <= 60; hizb++) {
      expect(maqrasInHizb(hizb)).toHaveLength(4);
    }
  });

  it('lists the hizbs of a juz', () => {
    expect(hizbsInJuz(1)).toEqual([1, 2]);
    expect(hizbsInJuz(30)).toEqual([59, 60]);
  });

  it('finds the maqra containing an ayah', () => {
    expect(maqraForAyah(1, 1)?.id).toBe(1);
    expect(maqraForAyah(114, 6)?.id).toBe(240);
    expect(maqraForAyah(999, 1)).toBeUndefined();
  });
});

describe('maqra labels', () => {
  it('uses a single-surah form when it does not cross a boundary', () => {
    const single = MAQRAS.find((m) => m.segments.length === 1)!;
    expect(maqraRangeLabel(single)).toMatch(/^[^–]+ \d+–\d+$/);
  });

  it('names both surahs when it crosses a boundary', () => {
    const crossing = MAQRAS.find((m) => new Set(m.segments.map((s) => s.surah)).size > 1)!;
    expect(crossing).toBeDefined();
    expect(maqraRangeLabel(crossing)).toMatch(/ – /);
  });
});

describe('maqra progress', () => {
  const maqra = maqraById(240)!; // last rub' — short, spans several short surahs

  const recordsFor = (n: number): AyahRecord[] =>
    maqraAyahs(maqra)
      .slice(0, n)
      .map(({ surah, ayah }) => ({
        surah,
        ayah,
        state: 'memorized' as const,
        updatedAt: '2026-01-01T00:00:00.000Z',
        reviewCount: 0,
        ladderOffset: 0,
      }));

  it('reports zero for an empty record set', () => {
    expect(maqraProgress(maqra, [])).toMatchObject({
      memorized: 0,
      learning: 0,
      percent: 0,
    });
  });

  it('counts memorized ayat inside the maqra', () => {
    const p = maqraProgress(maqra, recordsFor(3));
    expect(p.memorized).toBe(3);
    expect(p.total).toBe(maqra.ayahCount);
  });

  it('reaches 100% when every ayah is memorized', () => {
    const p = maqraProgress(maqra, recordsFor(maqra.ayahCount));
    expect(p.memorized).toBe(maqra.ayahCount);
    expect(p.percent).toBe(100);
  });

  it('ignores records outside the maqra', () => {
    const outside: AyahRecord[] = [
      {
        surah: 2,
        ayah: 1,
        state: 'memorized',
        updatedAt: '2026-01-01T00:00:00.000Z',
        reviewCount: 0,
        ladderOffset: 0,
      },
    ];
    expect(maqraProgress(maqra, outside).memorized).toBe(0);
  });

  it('combines progress across a juz', () => {
    const juz30 = maqrasInJuz(30);
    const totalAyat = juz30.reduce((n, m) => n + m.ayahCount, 0);
    expect(combinedProgress(juz30, []).total).toBe(totalAyat);
  });
});
