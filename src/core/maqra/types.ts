// maqra-core — pure types. No RN/React/IO imports allowed in this dir.
//
// A "maqra" here is a rub' al-hizb: one of the 240 standard quarter-hizb
// divisions of the mushaf. Averages ~26 ayat, which is the right size for a
// single sitting. 51 of the 240 cross a surah boundary, so a maqra is modelled
// as a list of per-surah segments rather than one (surah, from, to) range.

import type { SurahId, AyahNumber } from '@core/hifz/types';

/** A contiguous run of ayat inside one surah. */
export interface MaqraSegment {
  surah: SurahId;
  from: AyahNumber;
  to: AyahNumber;
}

export interface Maqra {
  /** 1..240 — the rub' al-hizb number, stable across the whole mushaf. */
  id: number;
  /** 1..30 */
  juz: number;
  /** 1..60 */
  hizb: number;
  /** 1..4 — which quarter of its hizb this is. */
  quarterInHizb: number;
  /** Ordered, non-overlapping, ascending. Length > 1 when it crosses surahs. */
  segments: MaqraSegment[];
  ayahCount: number;
}

/** One ayah address, used when a maqra is flattened for playback. */
export interface AyahRef {
  surah: SurahId;
  ayah: AyahNumber;
}

export interface MaqraProgress {
  memorized: number;
  learning: number;
  total: number;
  /** 0..100, one decimal. */
  percent: number;
}

export const TOTAL_MAQRAS = 240;
export const TOTAL_HIZBS = 60;
export const TOTAL_JUZ = 30;
