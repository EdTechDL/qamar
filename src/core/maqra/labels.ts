// Human-readable maqra references, e.g. "An-Naba 1 – An-Nazi'at 46".

import structure from '@content/structure.json';
import type { SurahMeta } from '@content/types';
import type { Maqra, MaqraSegment } from './types';

const SURAHS = structure as SurahMeta[];
const BY_ID = new Map(SURAHS.map((s) => [s.id, s]));

export function surahName(id: number): string {
  return BY_ID.get(id)?.nameTransliterated ?? `Surah ${id}`;
}

export function surahNameArabic(id: number): string {
  return BY_ID.get(id)?.nameArabic ?? '';
}

function first(segments: readonly MaqraSegment[]): MaqraSegment | undefined {
  return segments[0];
}

function last(segments: readonly MaqraSegment[]): MaqraSegment | undefined {
  return segments[segments.length - 1];
}

/**
 * "An-Naba 1 – 40" when the maqra sits inside one surah,
 * "An-Naba 1 – An-Nazi'at 46" when it crosses a boundary.
 */
export function maqraRangeLabel(maqra: Maqra): string {
  const head = first(maqra.segments);
  const tail = last(maqra.segments);
  if (!head || !tail) return '—';

  if (head.surah === tail.surah) {
    return `${surahName(head.surah)} ${head.from}–${tail.to}`;
  }
  return `${surahName(head.surah)} ${head.from} – ${surahName(tail.surah)} ${tail.to}`;
}

/** "Juz 30 · Hizb 59 · Rub' 2" */
export function maqraPositionLabel(maqra: Maqra): string {
  return `Juz ${maqra.juz} · Hizb ${maqra.hizb} · Rub' ${maqra.quarterInHizb}`;
}

/** Short form for dense list rows: "30 · 59.2" */
export function maqraShortLabel(maqra: Maqra): string {
  return `${maqra.juz} · ${maqra.hizb}.${maqra.quarterInHizb}`;
}

/** The surahs a maqra touches, in order. */
export function maqraSurahs(maqra: Maqra): number[] {
  return [...new Set(maqra.segments.map((s) => s.surah))];
}
