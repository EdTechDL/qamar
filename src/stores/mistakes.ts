// Zustand — teacher corrections, persisted. These survive every app open
// until the user clears them, which is the whole point of the feature.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MistakeMark } from '@core/mistakes';

let counter = 0;
function newId(): string {
  counter += 1;
  return `mk_${Date.now().toString(36)}_${counter.toString(36)}`;
}

interface MistakesState {
  marks: MistakeMark[];
  /** Last removed mark, so the undo snackbar can put it back (SPEC §15.3). */
  lastRemoved: MistakeMark | null;

  addMark: (input: Omit<MistakeMark, 'id' | 'createdAt'>) => MistakeMark;
  removeMark: (id: string) => void;
  restoreLastRemoved: () => void;
  setNote: (id: string, note: string) => void;
  clearAyah: (surah: number, ayah: number) => void;
  clearAll: () => void;
}

export const useMistakesStore = create<MistakesState>()(
  persist(
    (set, get) => ({
      marks: [],
      lastRemoved: null,

      addMark: (input) => {
        const from = Math.min(input.from, input.to);
        const to = Math.max(input.from, input.to);
        // Absorb anything already marked inside the new span so overlapping
        // corrections collapse into one highlight instead of stacking.
        const overlapping = get().marks.filter(
          (m) => m.surah === input.surah && m.ayah === input.ayah && m.from <= to && m.to >= from,
        );
        const merged: MistakeMark = {
          ...input,
          from: Math.min(from, ...overlapping.map((m) => m.from)),
          to: Math.max(to, ...overlapping.map((m) => m.to)),
          id: newId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          marks: [...s.marks.filter((m) => !overlapping.includes(m)), merged],
        }));
        return merged;
      },

      removeMark: (id) =>
        set((s) => {
          const target = s.marks.find((m) => m.id === id) ?? null;
          return {
            marks: s.marks.filter((m) => m.id !== id),
            lastRemoved: target,
          };
        }),

      restoreLastRemoved: () =>
        set((s) => (s.lastRemoved ? { marks: [...s.marks, s.lastRemoved], lastRemoved: null } : s)),

      setNote: (id, note) =>
        set((s) => ({
          marks: s.marks.map((m) => (m.id === id ? { ...m, note } : m)),
        })),

      clearAyah: (surah, ayah) =>
        set((s) => ({
          marks: s.marks.filter((m) => !(m.surah === surah && m.ayah === ayah)),
        })),

      clearAll: () => set({ marks: [], lastRemoved: null }),
    }),
    {
      name: 'qamar.mistakes.v1',
      storage: createJSONStorage(() => AsyncStorage),
      // The undo slot is session-scoped — do not persist.
      partialize: (s) => ({ marks: s.marks }),
    },
  ),
);
