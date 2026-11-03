// Repeat-aware sequencer. SPEC §12.5 — "repeat current ayah ×N" and
// "range play with optional per-ayah repeat count" are the core memorization
// workflow, so they live in one place rather than being re-derived per screen.
//
// Works over a flat AyahRef list, which means it drives a single ayah, a
// surah range, or a cross-surah maqra with the same code path.

import type { AyahRef } from '@core/maqra/types';
import { playAyah, stopPlayback } from './player';

/** `Infinity` means "until the user stops". */
export type RepeatCount = number;

export interface SequenceProgress {
  surah: number;
  ayah: number;
  /** 0-based position within the sequence. */
  index: number;
  total: number;
  /** 1-based repeat of the current ayah. */
  repeat: number;
  ayahRepeat: RepeatCount;
  /** 1-based pass over the whole sequence. */
  pass: number;
  setRepeat: RepeatCount;
}

export interface SequenceOptions {
  /** Times each ayah repeats before moving on. Default 1. */
  ayahRepeat?: RepeatCount;
  /** Times the whole sequence repeats. Default 1. */
  setRepeat?: RepeatCount;
  rate?: number;
  /** Which reciter to stream. Defaults to the project default. */
  qariId?: string;
  /** Fired on every track start, and once with null when the run ends. */
  onProgress?: (p: SequenceProgress | null) => void;
  /** Fired after the last pass completes. Not fired on stop(). */
  onDone?: () => void;
  /** Playback failed. The run halts rather than racing to the end. */
  onError?: () => void;
}

export interface SequenceHandle {
  stop: () => Promise<void>;
}

// Traditional recitation opens with the basmalah when you begin at the first
// ayah of a surah — except Al-Fatiha (whose ayah 1 is the basmalah) and
// At-Tawba (which has none). Played at the top of each pass, as a reciter
// would when restarting.
const BASMALAH: AyahRef = { surah: 1, ayah: 1 };

function needsBasmalah(ref: AyahRef | undefined): boolean {
  if (!ref) return false;
  return ref.ayah === 1 && ref.surah !== 1 && ref.surah !== 9;
}

function normalizeRepeat(n: RepeatCount | undefined): RepeatCount {
  if (n === undefined) return 1;
  if (n === Infinity) return Infinity;
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

let sequenceGeneration = 0;

/**
 * Starts playback and returns immediately. Any previously running sequence is
 * preempted. Progress arrives via `onProgress`.
 */
export async function playSequence(
  refs: readonly AyahRef[],
  opts: SequenceOptions = {},
): Promise<SequenceHandle> {
  const gen = ++sequenceGeneration;
  const ayahRepeat = normalizeRepeat(opts.ayahRepeat);
  const setRepeat = normalizeRepeat(opts.setRepeat);
  const total = refs.length;

  const alive = () => gen === sequenceGeneration;
  const noop: SequenceHandle = { stop: async () => {} };

  if (total === 0) {
    opts.onProgress?.(null);
    opts.onDone?.();
    return noop;
  }

  // Cursor state, advanced by the step function below.
  let index = 0;
  let repeat = 1;
  let pass = 1;

  const finish = (): void => {
    if (!alive()) return;
    opts.onProgress?.(null);
    opts.onDone?.();
  };

  const step = async (): Promise<void> => {
    if (!alive()) return;

    const ref = refs[index];
    if (!ref) return finish();

    opts.onProgress?.({
      surah: ref.surah,
      ayah: ref.ayah,
      index,
      total,
      repeat,
      ayahRepeat,
      pass,
      setRepeat,
    });

    await playAyah(ref.surah, ref.ayah, {
      rate: opts.rate,
      qariId: opts.qariId,
      onError: () => {
        if (!alive()) return;
        sequenceGeneration += 1;
        opts.onProgress?.(null);
        opts.onError?.();
      },
      onFinished: () => {
        if (!alive()) return;
        // Same ayah again?
        if (repeat < ayahRepeat) {
          repeat += 1;
          void step();
          return;
        }
        // Next ayah in this pass.
        repeat = 1;
        if (index + 1 < total) {
          index += 1;
          void step();
          return;
        }
        // Pass complete — go round again?
        if (pass < setRepeat) {
          pass += 1;
          index = 0;
          void startPass();
          return;
        }
        finish();
      },
    });
  };

  const startPass = async (): Promise<void> => {
    if (!alive()) return;
    if (needsBasmalah(refs[0])) {
      const head = refs[0]!;
      // Highlight the ayah the listener is about to hear while the basmalah plays.
      opts.onProgress?.({
        surah: head.surah,
        ayah: head.ayah,
        index: 0,
        total,
        repeat: 1,
        ayahRepeat,
        pass,
        setRepeat,
      });
      await playAyah(BASMALAH.surah, BASMALAH.ayah, {
        rate: opts.rate,
        qariId: opts.qariId,
        onFinished: () => {
          if (alive()) void step();
        },
      });
      return;
    }
    await step();
  };

  await startPass();

  return {
    stop: async () => {
      if (!alive()) return;
      sequenceGeneration += 1;
      await stopPlayback();
      opts.onProgress?.(null);
    },
  };
}

/** Stop whatever this module is playing. */
export async function stopSequence(): Promise<void> {
  sequenceGeneration += 1;
  await stopPlayback();
}
