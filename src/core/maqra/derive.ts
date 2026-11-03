// Derive the 240 maqras (rub' al-hizb) from the bundled ayah-index.
//
// The index already carries `hizbQuarter: 1..240` for every one of the 6,236
// ayat, so the division is read from the data rather than hardcoded. Built
// once at module load (~6k iterations) and frozen.

import ayahIndexJson from '@content/ayah-index.json';
import type { AyahIndex } from '@core/hifz/types';
import { TOTAL_MAQRAS, type AyahRef, type Maqra, type MaqraSegment } from './types';

const AYAH_INDEX = ayahIndexJson as AyahIndex;

/**
 * Walks the index in mushaf order and groups ayat by their hizbQuarter,
 * collapsing consecutive ayat of the same surah into one segment.
 */
function buildMaqras(): readonly Maqra[] {
  // Bucket every ayah by quarter. Keys are "surah:ayah"; sort numerically so
  // the walk is in mushaf order regardless of JSON key order.
  const ordered = Object.keys(AYAH_INDEX)
    .map((key) => {
      const [surahRaw, ayahRaw] = key.split(':');
      return { surah: Number(surahRaw), ayah: Number(ayahRaw), key };
    })
    .sort((a, b) => a.surah - b.surah || a.ayah - b.ayah);

  const segmentsByQuarter = new Map<number, MaqraSegment[]>();
  const metaByQuarter = new Map<number, { juz: number }>();

  for (const { surah, ayah, key } of ordered) {
    const entry = AYAH_INDEX[key];
    if (!entry) continue;
    const q = entry.hizbQuarter;

    if (!metaByQuarter.has(q)) metaByQuarter.set(q, { juz: entry.juz });

    const segments = segmentsByQuarter.get(q);
    if (!segments) {
      segmentsByQuarter.set(q, [{ surah, from: ayah, to: ayah }]);
      continue;
    }
    const last = segments[segments.length - 1]!;
    if (last.surah === surah && last.to === ayah - 1) {
      last.to = ayah;
    } else {
      segments.push({ surah, from: ayah, to: ayah });
    }
  }

  const maqras: Maqra[] = [];
  for (let id = 1; id <= TOTAL_MAQRAS; id++) {
    const segments = segmentsByQuarter.get(id) ?? [];
    const meta = metaByQuarter.get(id);
    const ayahCount = segments.reduce((n, s) => n + (s.to - s.from + 1), 0);
    maqras.push(
      Object.freeze({
        id,
        // Quarters run 1..240 in order, so hizb/quarter fall out of the id.
        juz: meta?.juz ?? Math.ceil(id / 8),
        hizb: Math.ceil(id / 4),
        quarterInHizb: ((id - 1) % 4) + 1,
        segments: Object.freeze(segments) as unknown as MaqraSegment[],
        ayahCount,
      }),
    );
  }
  return Object.freeze(maqras);
}

export const MAQRAS: readonly Maqra[] = buildMaqras();

/** 1-based lookup. Returns undefined outside 1..240. */
export function maqraById(id: number): Maqra | undefined {
  if (!Number.isInteger(id) || id < 1 || id > TOTAL_MAQRAS) return undefined;
  return MAQRAS[id - 1];
}

/** The maqras belonging to a juz (normally 8). */
export function maqrasInJuz(juz: number): Maqra[] {
  return MAQRAS.filter((m) => m.juz === juz);
}

/** The maqras belonging to a hizb (always 4). */
export function maqrasInHizb(hizb: number): Maqra[] {
  return MAQRAS.filter((m) => m.hizb === hizb);
}

/** The hizbs belonging to a juz (normally 2). */
export function hizbsInJuz(juz: number): number[] {
  return [...new Set(maqrasInJuz(juz).map((m) => m.hizb))].sort((a, b) => a - b);
}

/** Which maqra contains a given ayah. */
export function maqraForAyah(surah: number, ayah: number): Maqra | undefined {
  const entry = AYAH_INDEX[`${surah}:${ayah}`];
  if (!entry) return undefined;
  return maqraById(entry.hizbQuarter);
}

/** Flatten a maqra to the ordered ayah list used by the audio sequencer. */
export function maqraAyahs(maqra: Maqra): AyahRef[] {
  const out: AyahRef[] = [];
  for (const seg of maqra.segments) {
    for (let a = seg.from; a <= seg.to; a++) out.push({ surah: seg.surah, ayah: a });
  }
  return out;
}

/** Flatten an arbitrary segment list the same way (used by custom selections). */
export function segmentAyahs(segments: readonly MaqraSegment[]): AyahRef[] {
  const out: AyahRef[] = [];
  for (const seg of segments) {
    for (let a = seg.from; a <= seg.to; a++) out.push({ surah: seg.surah, ayah: a });
  }
  return out;
}
