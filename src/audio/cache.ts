// Audio cache manager. SPEC §12.3.
// On native: caches per-ayah MP3s under FileSystem.documentDirectory, in a
// directory keyed by qari id so two reciters never share a file.
// On web: no-ops — playback streams every time (Cache API path is a follow-up).

import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { qariById } from './sources';

const ROOT = `${FileSystem.documentDirectory ?? ''}audio/`;

function pad3(n: number): string {
  return n.toString().padStart(3, '0');
}

function localPathFor(qariId: string, surah: number, ayah: number): string {
  return `${ROOT}${qariId}/${pad3(surah)}/${pad3(ayah)}.mp3`;
}

async function ensureSurahDir(qariId: string, surah: number): Promise<void> {
  const dir = `${ROOT}${qariId}/${pad3(surah)}/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

// Returns a URI that expo-av can load: either a file:// local path (native,
// cached) or the remote URL (web or first-listen on native).
export async function resolveAudioUri(
  surah: number,
  ayah: number,
  qariId?: string,
): Promise<string> {
  const qari = qariById(qariId);
  const remote = qari.buildUrl(surah, ayah);
  if (Platform.OS === 'web') return remote;

  const local = localPathFor(qari.id, surah, ayah);
  try {
    const info = await FileSystem.getInfoAsync(local);
    if (info.exists) return local;
    await ensureSurahDir(qari.id, surah);
    const result = await FileSystem.downloadAsync(remote, local);
    if (result.status !== 200) {
      // Cache write failed but we can still stream.
      return remote;
    }
    return result.uri;
  } catch {
    return remote;
  }
}

export async function isCached(surah: number, ayah: number, qariId?: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const info = await FileSystem.getInfoAsync(localPathFor(qariById(qariId).id, surah, ayah));
    return info.exists;
  } catch {
    return false;
  }
}
