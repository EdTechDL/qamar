// Qari registry + URL builders. SPEC §12.2.
//
// D3 (2026-08-15): recitations are served from the Al Quran Cloud / Islamic
// Network CDN — the same project that supplies the bundled text. Their terms
// §IV state the recitations are "licensed to us by the reciters or their
// estates for free, non-commercial redistribution at the bitrates we publish",
// and grant downstream "personal and educational use".
//
// That is an actual permission chain. The previous source (everyayah.com)
// published no audio licence at all: its only licensing text covers the
// separate timing files, and the URL it points at 404s. The "EveryAyah is
// CC-BY-NC" claim that circulates online originates from a third party
// *requesting* clarification, not from any rights holder granting it.
//
// Copyright still rests with the reciters, who may ask for removal. Do not
// re-encode or rehost these files — the grant is scoped to the bitrates the
// CDN publishes. See docs/audio-sources.md and issue #3.

import structure from '@content/structure.json';
import type { SurahMeta } from '@content/types';

export interface QariSource {
  id: string;
  displayName: string;
  buildUrl: (surah: number, ayah: number) => string;
  attribution: string;
}

const SURAHS = structure as SurahMeta[];

// The CDN addresses ayahs by their position in the whole mushaf (1..6236)
// rather than by surah/ayah, so build the offset table once at module load.
// Sorted by id, and indexed only at real surah ids, so an out-of-range surah
// misses the table instead of running off the end of the mushaf.
const SURAH_OFFSETS: readonly (readonly [before: number, count: number])[] = (() => {
  const table: [number, number][] = [];
  let running = 0;
  for (const surah of [...SURAHS].sort((a, b) => a.id - b.id)) {
    table[surah.id] = [running, surah.ayahCount];
    running += surah.ayahCount;
  }
  return table;
})();

export const TOTAL_AYAHS = 6236;

/** Position of an ayah within the whole mushaf, 1-based. 2:255 → 262. */
export function globalAyahNumber(surah: number, ayah: number): number {
  const entry = SURAH_OFFSETS[surah];
  if (entry === undefined) throw new RangeError(`Unknown surah: ${surah}`);
  const [before, count] = entry;
  if (ayah < 1 || ayah > count) {
    throw new RangeError(`Surah ${surah} has no ayah ${ayah} (1..${count})`);
  }
  return before + ayah;
}

// 128 kbps is the highest the CDN publishes for every edition. Changing this
// changes the cache directory too, which is intentional: mixing encodings in
// one cache would be worse than re-downloading.
const BITRATE = 128;

export const QARIS: readonly QariSource[] = [
  {
    id: `alquran-cloud-husary-${BITRATE}`,
    displayName: 'Mahmoud Khalil Al-Husary (murattal)',
    buildUrl: (surah, ayah) =>
      `https://cdn.islamic.network/quran/audio/${BITRATE}/ar.husary/${globalAyahNumber(surah, ayah)}.mp3`,
    attribution: 'Mahmoud Khalil Al-Husary — Al Quran Cloud (cdn.islamic.network)',
  },
];

export const DEFAULT_QARI = QARIS[0]!;

export function urlFor(surah: number, ayah: number): string {
  return DEFAULT_QARI.buildUrl(surah, ayah);
}
