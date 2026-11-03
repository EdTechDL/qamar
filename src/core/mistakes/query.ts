// Lookups over the mistake log: per ayah for rendering, per maqra/surah for
// the browse badges.

import { keyOf } from '@core/hifz/types';
import { maqraAyahs } from '@core/maqra/derive';
import type { Maqra } from '@core/maqra/types';
import type { MarksByAyah, MistakeLog, MistakeMark } from './types';

export function groupByAyah(marks: MistakeLog): MarksByAyah {
  const map: MarksByAyah = new Map();
  for (const mark of marks) {
    const key = keyOf(mark.surah, mark.ayah);
    const list = map.get(key);
    if (list) list.push(mark);
    else map.set(key, [mark]);
  }
  return map;
}

export function marksForAyah(marks: MistakeLog, surah: number, ayah: number): MistakeMark[] {
  return marks.filter((m) => m.surah === surah && m.ayah === ayah);
}

/** How many marks sit inside a maqra — the browse-row badge. */
export function maqraMistakeCount(marks: MistakeLog, maqra: Maqra): number {
  if (marks.length === 0) return 0;
  const inMaqra = new Set(maqraAyahs(maqra).map(({ surah, ayah }) => keyOf(surah, ayah)));
  return marks.reduce((n, m) => (inMaqra.has(keyOf(m.surah, m.ayah)) ? n + 1 : n), 0);
}

/** Same, for a list of maqras (juz and hizb rows). */
export function combinedMistakeCount(marks: MistakeLog, maqras: readonly Maqra[]): number {
  if (marks.length === 0) return 0;
  const inSet = new Set<string>();
  for (const maqra of maqras) {
    for (const { surah, ayah } of maqraAyahs(maqra)) inSet.add(keyOf(surah, ayah));
  }
  return marks.reduce((n, m) => (inSet.has(keyOf(m.surah, m.ayah)) ? n + 1 : n), 0);
}

export function surahMistakeCount(marks: MistakeLog, surah: number): number {
  return marks.reduce((n, m) => (m.surah === surah ? n + 1 : n), 0);
}

/**
 * True when [from, to] touches an existing mark — used to turn a tap on a
 * highlight into a removal rather than a new selection.
 */
export function markAt(marks: readonly MistakeMark[], cluster: number): MistakeMark | undefined {
  return marks.find((m) => cluster >= m.from && cluster <= m.to);
}

/** Every cluster index covered by any mark, for fast render-time lookup. */
export function coveredClusters(marks: readonly MistakeMark[]): Set<number> {
  const set = new Set<number>();
  for (const m of marks) {
    for (let i = m.from; i <= m.to; i++) set.add(i);
  }
  return set;
}
