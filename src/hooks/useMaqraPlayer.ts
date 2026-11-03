// Drives repeat playback for a maqra (or any ayah list) and keeps the
// reading highlight in sync.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureAudioConfigured } from '@audio/player';
import { playSequence, stopSequence, type SequenceProgress } from '@audio/sequence';
import { maqraAyahs } from '@core/maqra';
import type { AyahRef, Maqra } from '@core/maqra/types';
import { useAudioPrefsStore, toRepeatCount } from '@stores/audioPrefs';
import { useActivityStore } from '@stores/activity';
import { useSessionStore } from '@stores/session';

export interface MaqraPlayerState {
  playing: boolean;
  loading: boolean;
  progress: SequenceProgress | null;
  playMaqra: (maqra: Maqra) => Promise<void>;
  playAyahs: (refs: readonly AyahRef[]) => Promise<void>;
  stop: () => Promise<void>;
}

export function useMaqraPlayer(): MaqraPlayerState {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<SequenceProgress | null>(null);
  const mounted = useRef(true);

  const ayahRepeat = useAudioPrefsStore((s) => s.ayahRepeat);
  const setRepeat = useAudioPrefsStore((s) => s.setRepeat);
  const rate = useAudioPrefsStore((s) => s.rate);
  const qariId = useAudioPrefsStore((s) => s.qariId);
  const setPlayingAyah = useSessionStore((s) => s.setPlayingAyah);
  const record = useActivityStore((s) => s.record);

  // Counts distinct ayat heard in this run so the activity log gets one
  // increment per ayah rather than one per repeat.
  const heard = useRef(new Set<string>());

  useEffect(() => {
    void ensureAudioConfigured();
    return () => {
      mounted.current = false;
      void stopSequence();
    };
  }, []);

  const run = useCallback(
    async (refs: readonly AyahRef[], isMaqra: boolean) => {
      if (refs.length === 0) return;
      setLoading(true);
      heard.current = new Set();
      try {
        await playSequence(refs, {
          ayahRepeat: toRepeatCount(ayahRepeat),
          setRepeat: toRepeatCount(setRepeat),
          rate,
          qariId,
          onProgress: (p) => {
            if (!mounted.current) return;
            setProgress(p);
            setPlaying(p !== null);
            setPlayingAyah(p ? { surah: p.surah, ayah: p.ayah } : null);
            if (p) {
              const key = `${p.surah}:${p.ayah}`;
              if (!heard.current.has(key)) {
                heard.current.add(key);
                record('ayatListened');
              }
            }
          },
          onDone: () => {
            if (!mounted.current) return;
            if (isMaqra) record('maqrasReviewed');
          },
          onError: () => {
            if (!mounted.current) return;
            setPlaying(false);
            setProgress(null);
            setPlayingAyah(null);
          },
        });
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [ayahRepeat, setRepeat, rate, qariId, setPlayingAyah, record],
  );

  const playMaqra = useCallback((maqra: Maqra) => run(maqraAyahs(maqra), true), [run]);

  const playAyahs = useCallback((refs: readonly AyahRef[]) => run(refs, false), [run]);

  const stop = useCallback(async () => {
    await stopSequence();
    if (!mounted.current) return;
    setPlaying(false);
    setProgress(null);
    setPlayingAyah(null);
  }, [setPlayingAyah]);

  return { playing, loading, progress, playMaqra, playAyahs, stop };
}
