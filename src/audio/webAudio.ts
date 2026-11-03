// Web playback on ONE reused <audio> element.
//
// Why this exists: expo-av's web backend does `new Audio(src)` for every clip
// (see ExponentAV.web.js loadForSound). On desktop that is harmless. On iOS it
// is fatal — Safari only lets an element play if that *same element* was
// played inside a user gesture, so the tap unlocks element #1 and then every
// subsequent ayah, created fresh from an `onended` callback with no gesture in
// sight, is silently refused. Audio "works on the computer, not on the phone".
//
// So: one element for the whole app, unlocked once on the first tap, and
// afterwards only its `src` changes. Swapping src on an unlocked element keeps
// the unlock.

import { Platform } from 'react-native';

/** 44-byte silent WAV — just enough to satisfy a play() inside a gesture. */
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

let element: HTMLAudioElement | null = null;
let unlocked = false;

export function isWeb(): boolean {
  return Platform.OS === 'web';
}

function audioElement(): HTMLAudioElement | null {
  if (!isWeb()) return null;
  const AudioCtor = (globalThis as { Audio?: typeof HTMLAudioElement }).Audio;
  if (!AudioCtor) return null;
  if (!element) {
    element = new AudioCtor();
    element.preload = 'auto';
    // Keeps iOS from taking the clip fullscreen and from pausing on scroll.
    element.setAttribute('playsinline', '');
    element.setAttribute('webkit-playsinline', '');
  }
  return element;
}

/**
 * Must be called SYNCHRONOUSLY from a user gesture (a Pressable's onPress),
 * before any await. Safe to call repeatedly; it no-ops once unlocked.
 */
export function unlockWebAudio(): void {
  if (!isWeb() || unlocked) return;
  const a = audioElement();
  if (!a) return;
  try {
    a.src = SILENT_WAV;
    const p = a.play();
    if (p && typeof p.then === 'function') {
      void p
        .then(() => {
          unlocked = true;
          a.pause();
          a.currentTime = 0;
        })
        .catch(() => {
          // Autoplay policy refused us; the next real tap tries again.
        });
    } else {
      unlocked = true;
    }
  } catch {
    // Element not ready — the next gesture retries.
  }
}

export interface WebPlayHandle {
  stop: () => void;
}

/**
 * Points the shared element at `url` and plays it. `onFinished` fires once,
 * only for this call — a later call replaces the handler, so a cancelled
 * sequence can never advance itself.
 */
export function playWebUrl(
  url: string,
  opts: { rate?: number; onFinished?: () => void; onError?: () => void } = {},
): WebPlayHandle {
  const a = audioElement();
  if (!a) return { stop: () => {} };

  let done = false;
  const finish = (fn?: () => void) => {
    if (done) return;
    done = true;
    a.onended = null;
    a.onerror = null;
    fn?.();
  };

  a.onended = () => finish(opts.onFinished);
  a.onerror = () => finish(opts.onError ?? opts.onFinished);

  a.src = url;
  a.playbackRate = opts.rate ?? 1;
  try {
    a.currentTime = 0;
  } catch {
    // Not seekable yet; starting at 0 is the default anyway.
  }

  const started = a.play();
  if (started && typeof started.then === 'function') {
    void started.catch(() => finish(opts.onError ?? opts.onFinished));
  }

  return {
    stop: () => {
      done = true;
      a.onended = null;
      a.onerror = null;
      try {
        a.pause();
      } catch {
        // ignore
      }
    },
  };
}

/** Pause the shared element without tearing it down (keeps the unlock). */
export function stopWebAudio(): void {
  const a = element;
  if (!a) return;
  a.onended = null;
  a.onerror = null;
  try {
    a.pause();
  } catch {
    // ignore
  }
}
