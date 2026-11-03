// Thin wrapper that lets a component play/stop a single ayah with state.
// Syncs with session.playingAyah so all three renderings (continuous,
// fragmented, verse sheet) show the same highlight.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureAudioConfigured, playRange, stopPlayback } from '@audio/player';
import { unlockWebAudio } from '@audio/webAudio';
import { useSessionStore } from '@stores/session';
import { useAudioPrefsStore } from '@stores/audioPrefs';

export function useAyahAudio() {
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);
  const setPlayingAyah = useSessionStore((s) => s.setPlayingAyah);
  const playingAyah = useSessionStore((s) => s.playingAyah);
  const qariId = useAudioPrefsStore((s) => s.qariId);

  useEffect(() => {
    void ensureAudioConfigured();
    return () => {
      mounted.current = false;
    };
  }, []);

  const play = useCallback(
    async (surah: number, ayah: number) => {
      unlockWebAudio();
      setLoading(true);
      try {
        // Route through playRange so the basmalah prefix applies uniformly
        // to any ayah-1 play (Listen mode, Détails sheet, header Play).
        await playRange(
          surah,
          ayah,
          ayah,
          (v) => {
            if (mounted.current) setPlayingAyah(v);
          },
          { qariId },
        );
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [setPlayingAyah, qariId],
  );

  const stop = useCallback(async () => {
    await stopPlayback();
    setPlayingAyah(null);
  }, [setPlayingAyah]);

  const isPlaying = useCallback(
    (surah: number, ayah: number) => playingAyah?.surah === surah && playingAyah?.ayah === ayah,
    [playingAyah],
  );

  return { play, stop, loading, isPlaying };
}
