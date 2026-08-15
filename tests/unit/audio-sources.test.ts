// The CDN addresses ayahs by mushaf position, so an off-by-one here would
// silently play the wrong verse. Anchors are checked against known positions.

import structure from '@content/structure.json';
import type { SurahMeta } from '@content/types';
import { DEFAULT_QARI, globalAyahNumber, TOTAL_AYAHS, urlFor } from '@audio/sources';

const SURAHS = structure as SurahMeta[];

describe('globalAyahNumber', () => {
  it('starts the mushaf at 1', () => {
    expect(globalAyahNumber(1, 1)).toBe(1);
  });

  it('ends Al-Fatiha at 7', () => {
    expect(globalAyahNumber(1, 7)).toBe(7);
  });

  it('continues into the next surah without a gap', () => {
    expect(globalAyahNumber(2, 1)).toBe(8);
  });

  it('places Ayat al-Kursi (2:255) at 262', () => {
    expect(globalAyahNumber(2, 255)).toBe(262);
  });

  it('ends the mushaf at 6236', () => {
    expect(globalAyahNumber(114, 6)).toBe(TOTAL_AYAHS);
  });

  it('enumerates every ayah exactly once, in order', () => {
    let expected = 0;
    for (const surah of SURAHS) {
      for (let ayah = 1; ayah <= surah.ayahCount; ayah++) {
        expected++;
        expect(globalAyahNumber(surah.id, ayah)).toBe(expected);
      }
    }
    expect(expected).toBe(TOTAL_AYAHS);
  });

  it('rejects an unknown surah rather than returning a wrong verse', () => {
    expect(() => globalAyahNumber(115, 1)).toThrow(RangeError);
    expect(() => globalAyahNumber(0, 1)).toThrow(RangeError);
  });

  it('rejects an ayah outside the surah rather than bleeding into the next', () => {
    // Al-Fatiha has 7; without a bounds check 1:8 would resolve to 2:1.
    expect(() => globalAyahNumber(1, 8)).toThrow(RangeError);
    expect(() => globalAyahNumber(1, 0)).toThrow(RangeError);
  });
});

describe('urlFor', () => {
  it('builds a CDN url from the mushaf position', () => {
    expect(urlFor(2, 255)).toBe('https://cdn.islamic.network/quran/audio/128/ar.husary/262.mp3');
  });

  it('keys the cache directory by provider, reciter and bitrate', () => {
    // The id doubles as the on-device cache directory: changing the source or
    // bitrate must not let two encodings share one cache.
    expect(DEFAULT_QARI.id).toBe('alquran-cloud-husary-128');
  });

  it('credits the reciter and the provider', () => {
    expect(DEFAULT_QARI.attribution).toMatch(/Husary/);
    expect(DEFAULT_QARI.attribution).toMatch(/islamic\.network/);
  });
});
