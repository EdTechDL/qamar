// Qari registry + URL builders. SPEC §12.2.
//
// D3 (2026-08-15): recitations are served from the Al Quran Cloud / Islamic
// Network CDN — the same project that supplies the bundled text. Their terms
// §IV state the recitations are "licensed to us by the reciters or their
// estates for free, non-commercial redistribution at the bitrates we publish",
// and grant downstream "personal and educational use".
//
// That is an actual permission chain. Copyright still rests with the reciters,
// who may ask for removal. Do not re-encode or rehost these files — the grant
// is scoped to the bitrates the CDN publishes. See docs/audio-sources.md and
// issue #3.
//
// EXCEPTION (2026-11-03, owner request): Saad Al-Ghamdi is published by
// neither Islamic Network nor quran.com. The only per-ayah source is
// everyayah.com, which carries no audio licence of its own — the reason D3
// moved off it. It is included because the owner asked for it by name, it is
// flagged `unlicensed: true` here, and the Settings picker says so on the row.
// Remove the entry to undo; nothing else depends on it.

import structure from '@content/structure.json';
import type { SurahMeta } from '@content/types';

export interface QariSource {
  id: string;
  displayName: string;
  /** Short note shown under the name in the picker. */
  style: string;
  buildUrl: (surah: number, ayah: number) => string;
  attribution: string;
  /** True when the host publishes no licence for the recordings. */
  unlicensed?: boolean;
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

/** Validates surah/ayah without needing a mushaf position. */
function assertAyah(surah: number, ayah: number): void {
  const entry = SURAH_OFFSETS[surah];
  if (entry === undefined) throw new RangeError(`Unknown surah: ${surah}`);
  if (ayah < 1 || ayah > entry[1]) {
    throw new RangeError(`Surah ${surah} has no ayah ${ayah} (1..${entry[1]})`);
  }
}

// 128 kbps is the highest Islamic Network publishes for every edition below.
// Changing this changes the cache directory too, which is intentional: mixing
// encodings in one cache would be worse than re-downloading.
const BITRATE = 128;

function islamicNetwork(edition: string, displayName: string, style: string): QariSource {
  return {
    // Keeps the original `alquran-cloud-husary-128` shape: the id doubles as
    // the on-device cache directory, so renaming it would orphan every file
    // already downloaded.
    id: `alquran-cloud-${edition.replace(/^ar\./, '')}-${BITRATE}`,
    displayName,
    style,
    buildUrl: (surah, ayah) =>
      `https://cdn.islamic.network/quran/audio/${BITRATE}/${edition}/${globalAyahNumber(surah, ayah)}.mp3`,
    attribution: `${displayName} — Al Quran Cloud (cdn.islamic.network)`,
  };
}

function pad3(n: number): string {
  return n.toString().padStart(3, '0');
}

export const QARIS: readonly QariSource[] = [
  islamicNetwork('ar.husary', 'Mahmoud Khalil Al-Husary', 'Murattal · teaching standard'),
  {
    // See the EXCEPTION note at the top of this file.
    id: 'everyayah-ghamadi-40',
    displayName: 'Saad Al-Ghamdi',
    style: 'Murattal · 40 kbps',
    buildUrl: (surah, ayah) => {
      assertAyah(surah, ayah);
      return `https://everyayah.com/data/Ghamadi_40kbps/${pad3(surah)}${pad3(ayah)}.mp3`;
    },
    attribution: 'Saad Al-Ghamdi — everyayah.com',
    unlicensed: true,
  },
  islamicNetwork('ar.alafasy', 'Mishary Rashid Alafasy', 'Murattal'),
  islamicNetwork('ar.minshawi', 'Mohamed Siddiq Al-Minshawi', 'Murattal'),
  islamicNetwork('ar.shaatree', 'Abu Bakr Ash-Shaatree', 'Murattal'),
  islamicNetwork('ar.mahermuaiqly', 'Maher Al Muaiqly', 'Murattal'),
  islamicNetwork('ar.hudhaify', 'Ali Al-Hudhaify', 'Murattal'),
  islamicNetwork('ar.muhammadayyoub', 'Muhammad Ayyoub', 'Murattal'),
  islamicNetwork('ar.husarymujawwad', 'Mahmoud Khalil Al-Husary', 'Mujawwad · slower'),
];

export const DEFAULT_QARI = QARIS[0]!;

export function qariById(id: string | undefined): QariSource {
  if (!id) return DEFAULT_QARI;
  return QARIS.find((q) => q.id === id) ?? DEFAULT_QARI;
}

/** URL for an ayah from a specific qari (defaults to the project default). */
export function urlFor(surah: number, ayah: number, qariId?: string): string {
  return qariById(qariId).buildUrl(surah, ayah);
}
