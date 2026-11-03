// Per-maqra progress aggregates. Computed from records, never stored.

import { keyOf, type AyahRecord } from '@core/hifz/types';
import { maqraAyahs } from './derive';
import type { Maqra, MaqraProgress } from './types';

function indexRecords(records: readonly AyahRecord[]): Map<string, AyahRecord> {
  const map = new Map<string, AyahRecord>();
  for (const r of records) map.set(keyOf(r.surah, r.ayah), r);
  return map;
}

export function maqraProgress(maqra: Maqra, records: readonly AyahRecord[]): MaqraProgress {
  const byKey = indexRecords(records);
  let memorized = 0;
  let learning = 0;

  for (const { surah, ayah } of maqraAyahs(maqra)) {
    const rec = byKey.get(keyOf(surah, ayah));
    if (!rec) continue;
    if (rec.state === 'memorized') memorized += 1;
    else if (rec.state === 'learning') learning += 1;
  }

  const total = maqra.ayahCount;
  return {
    memorized,
    learning,
    total,
    percent: total === 0 ? 0 : Math.round((memorized / total) * 1000) / 10,
  };
}

/** Same aggregate over a set of maqras — used for juz and hizb rows. */
export function combinedProgress(
  maqras: readonly Maqra[],
  records: readonly AyahRecord[],
): MaqraProgress {
  const byKey = indexRecords(records);
  let memorized = 0;
  let learning = 0;
  let total = 0;

  for (const maqra of maqras) {
    total += maqra.ayahCount;
    for (const { surah, ayah } of maqraAyahs(maqra)) {
      const rec = byKey.get(keyOf(surah, ayah));
      if (!rec) continue;
      if (rec.state === 'memorized') memorized += 1;
      else if (rec.state === 'learning') learning += 1;
    }
  }

  return {
    memorized,
    learning,
    total,
    percent: total === 0 ? 0 : Math.round((memorized / total) * 1000) / 10,
  };
}
