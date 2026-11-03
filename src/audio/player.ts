// Playback engine. SPEC §12.5. Single active sound at a time — call playAyah()
// to preempt anything already playing.
//
// Web and native take different paths on purpose: see ./webAudio for why iOS
// needs one reused element rather than expo-av's element-per-clip.

import { Audio, type AVPlaybackStatus } from 'expo-av';
import { resolveAudioUri } from './cache';
import { urlFor } from './sources';
import { isWeb, playWebUrl, stopWebAudio, type WebPlayHandle } from './webAudio';

let current: Audio.Sound | null = null;
let currentWeb: WebPlayHandle | null = null;
let generation = 0;

async function unloadCurrent(): Promise<void> {
  if (currentWeb) {
    currentWeb.stop();
    currentWeb = null;
  }
  if (!current) return;
  try {
    await current.unloadAsync();
  } catch {
    // ignore
  }
  current = null;
}

export interface PlayHandle {
  stop: () => Promise<void>;
}

export async function playAyah(
  surah: number,
  ayah: number,
  opts: {
    rate?: number;
    qariId?: string;
    onFinished?: () => void;
    /** Playback could not start or died mid-clip. */
    onError?: () => void;
  } = {},
): Promise<PlayHandle> {
  const gen = ++generation;

  if (isWeb()) {
    // No cache lookup and no await before play(): the URL is derived
    // synchronously so the element starts as close to the gesture as possible.
    await unloadCurrent();
    if (gen !== generation) return { stop: async () => {} };

    const handle = playWebUrl(urlFor(surah, ayah, opts.qariId), {
      rate: opts.rate,
      onFinished: () => {
        if (gen === generation) opts.onFinished?.();
      },
      // A refused or interrupted play() must NOT be treated as "clip done".
      // On a weak phone connection that would march through the whole maqra
      // in a second, silently, which looks exactly like the bug it hides.
      onError: () => {
        if (gen === generation) opts.onError?.();
      },
    });
    currentWeb = handle;
    return {
      stop: async () => {
        if (currentWeb === handle) {
          handle.stop();
          currentWeb = null;
        }
      },
    };
  }

  await unloadCurrent();
  if (gen !== generation) return { stop: async () => {} };

  const uri = await resolveAudioUri(surah, ayah, opts.qariId);
  if (gen !== generation) return { stop: async () => {} };

  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, rate: opts.rate ?? 1, shouldCorrectPitch: true },
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        opts.onFinished?.();
        void unloadCurrent();
      }
    },
  );

  if (gen !== generation) {
    void sound.unloadAsync();
    return { stop: async () => {} };
  }

  current = sound;
  return {
    stop: async () => {
      if (current === sound) await unloadCurrent();
    },
  };
}

export async function stopPlayback(): Promise<void> {
  generation += 1;
  sequenceGen += 1;
  stopWebAudio();
  await unloadCurrent();
}

let sequenceGen = 0;

// Traditional recitation prefixes every surah except Al-Fatiha (surah 1,
// whose ayah 1 IS the basmalah) and At-Tawba (surah 9, no basmalah) with
// "Bismillah…". We reuse Al-Fatiha's ayah-1 recording as that prefix, glued
// to the first ayah's highlight so the user sees ayah 1 lit up while the
// basmalah plays.
const BASMALAH_SURAH = 1;
const BASMALAH_AYAH = 1;
function needsBasmalahPrefix(surah: number, fromAyah: number): boolean {
  if (fromAyah !== 1) return false;
  if (surah === 1) return false; // Al-Fatiha
  if (surah === 9) return false; // At-Tawba
  return true;
}

// Play a run of ayat back-to-back. Advances via onFinished callback of each
// track. Returns immediately with a stop() handle; the caller receives per-
// ayah progress via onAyahChange.
export async function playRange(
  surah: number,
  fromAyah: number,
  toAyah: number,
  onAyahChange: (v: { surah: number; ayah: number } | null) => void,
  opts: { rate?: number; qariId?: string } = {},
): Promise<{ stop: () => Promise<void> }> {
  const gen = ++sequenceGen;

  const playNext = async (ayah: number): Promise<void> => {
    if (gen !== sequenceGen) return;
    if (ayah > toAyah) {
      if (gen === sequenceGen) onAyahChange(null);
      return;
    }
    onAyahChange({ surah, ayah });
    await playAyah(surah, ayah, {
      rate: opts.rate,
      qariId: opts.qariId,
      onFinished: () => {
        void playNext(ayah + 1);
      },
    });
  };

  if (needsBasmalahPrefix(surah, fromAyah)) {
    // Highlight ayah 1 of the target surah while the basmalah plays.
    onAyahChange({ surah, ayah: 1 });
    await playAyah(BASMALAH_SURAH, BASMALAH_AYAH, {
      rate: opts.rate,
      qariId: opts.qariId,
      onFinished: () => {
        void playNext(fromAyah);
      },
    });
  } else {
    await playNext(fromAyah);
  }

  return {
    stop: async () => {
      if (gen === sequenceGen) {
        sequenceGen += 1;
        await unloadCurrent();
      }
    },
  };
}

// Configure the audio session once — background playback + silent-switch safe.
let configured = false;
export async function ensureAudioConfigured(): Promise<void> {
  if (configured) return;
  configured = true;
  // setAudioModeAsync is a native session concept; on web it either no-ops or
  // throws depending on the expo-av version, and we manage the element
  // ourselves anyway.
  if (isWeb()) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  } catch {
    // ignore — audio can still play, just with default session behavior
  }
}
