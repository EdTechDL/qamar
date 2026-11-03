// Zustand — playback preferences for the repeat workflow. Persisted, because
// "repeat each ayah 5×" is a habit, not a per-session decision.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_QARI } from '@audio/sources';

/** `0` is the stored stand-in for Infinity — JSON has no Infinity literal. */
export const INFINITE = 0;

export const AYAH_REPEAT_CHOICES = [1, 3, 5, 7, 10, INFINITE] as const;
export const SET_REPEAT_CHOICES = [1, 2, 3, 5, INFINITE] as const;
export const RATE_CHOICES = [0.75, 1, 1.25] as const;

export function toRepeatCount(stored: number): number {
  return stored === INFINITE ? Infinity : stored;
}

export function repeatLabel(stored: number): string {
  return stored === INFINITE ? '∞' : `${stored}×`;
}

interface AudioPrefsState {
  /** Times each ayah repeats before advancing. */
  ayahRepeat: number;
  setAyahRepeat: (n: number) => void;
  /** Times the whole maqra repeats. */
  setRepeat: number;
  setSetRepeat: (n: number) => void;
  rate: number;
  setRate: (n: number) => void;
  /** Selected reciter id — see @audio/sources QARIS. */
  qariId: string;
  setQariId: (id: string) => void;
}

export const useAudioPrefsStore = create<AudioPrefsState>()(
  persist(
    (set) => ({
      ayahRepeat: 3,
      setAyahRepeat: (n) => set({ ayahRepeat: n }),
      setRepeat: 1,
      setSetRepeat: (n) => set({ setRepeat: n }),
      rate: 1,
      setRate: (n) => set({ rate: n }),
      qariId: DEFAULT_QARI.id,
      setQariId: (id) => set({ qariId: id }),
    }),
    {
      name: 'qamar.audioPrefs.v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
