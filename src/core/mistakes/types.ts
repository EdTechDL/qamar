// mistakes-core — pure types. No RN/React/IO imports allowed in this dir.
//
// A mark records a correction a teacher made: the exact span of the ayah the
// user got wrong, kept until they clear it themselves.

import type { AyahNumber, SurahId } from '@core/hifz/types';

export interface MistakeMark {
  id: string;
  surah: SurahId;
  ayah: AyahNumber;
  /** Cluster index, inclusive. See @core/mistakes/segment. */
  from: number;
  /** Cluster index, inclusive. */
  to: number;
  /** The covered text, denormalized so lists can render without re-segmenting. */
  excerpt: string;
  /** Optional reminder, e.g. "madd too short". */
  note?: string;
  createdAt: string;
}

export type MistakeLog = MistakeMark[];

/** Grouped per ayah, the shape the reading components want. */
export type MarksByAyah = Map<string, MistakeMark[]>;
