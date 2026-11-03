// Zustand — the activity log behind streaks, the monthly calendar and the
// Tuesday class check-in. Persisted via AsyncStorage like the other stores.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  CLASS_WEEKDAY,
  dayKey,
  EMPTY_DAY,
  type ActivityLog,
  type ClassAnswer,
  type ClassLog,
  type DayActivity,
} from '@core/activity';

type Counter = keyof DayActivity;

interface ActivityState {
  log: ActivityLog;
  classLog: ClassLog;
  /** 0=Sunday … 6=Saturday. Tuesday by default; changeable in Settings. */
  classWeekday: number;
  /** Hour after which the class check-in may appear. */
  classAskAfterHour: number;

  /** Add to one of today's counters. All recording funnels through here. */
  record: (counter: Counter, amount?: number) => void;
  answerClass: (day: string, answer: ClassAnswer) => void;
  clearClassAnswer: (day: string) => void;
  setClassWeekday: (weekday: number) => void;
  setClassAskAfterHour: (hour: number) => void;
  resetActivity: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      log: {},
      classLog: {},
      classWeekday: CLASS_WEEKDAY,
      classAskAfterHour: 16,

      record: (counter, amount = 1) =>
        set((s) => {
          if (amount <= 0) return s;
          const today = dayKey(new Date());
          const day = s.log[today] ?? EMPTY_DAY;
          return {
            log: {
              ...s.log,
              [today]: { ...day, [counter]: day[counter] + amount },
            },
          };
        }),

      answerClass: (day, answer) => set((s) => ({ classLog: { ...s.classLog, [day]: answer } })),

      clearClassAnswer: (day) =>
        set((s) => {
          const next = { ...s.classLog };
          delete next[day];
          return { classLog: next };
        }),

      setClassWeekday: (weekday) =>
        set({ classWeekday: Math.max(0, Math.min(6, Math.floor(weekday))) }),

      setClassAskAfterHour: (hour) =>
        set({ classAskAfterHour: Math.max(0, Math.min(23, Math.floor(hour))) }),

      resetActivity: () => set({ log: {}, classLog: {} }),
    }),
    {
      name: 'qamar.activity.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        log: s.log,
        classLog: s.classLog,
        classWeekday: s.classWeekday,
        classAskAfterHour: s.classAskAfterHour,
      }),
    },
  ),
);

/** Imperative recorder for non-React call sites (audio callbacks, etc.). */
export const recordActivity = (counter: Counter, amount = 1): void =>
  useActivityStore.getState().record(counter, amount);
