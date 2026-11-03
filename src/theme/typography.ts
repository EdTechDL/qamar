// Typography tokens. SPEC §16.3.
//
// Sizes raised from the original 16/28 baseline: this app is read at arm's
// length on a phone, often in landscape, and undersized Arabic is the fastest
// way to lose a reader's place mid-ayah. `fontScale` in the settings store
// multiplies the Arabic size on top of these.

export const typography = {
  ui: { family: 'Inter', baseSize: 17, lineHeight: 1.5 },
  arabic: {
    familyPrimary: 'NotoNaskhArabic',
    familyAlt: 'Amiri',
    defaultSize: 34,
    minSize: 24,
    maxSize: 64,
  },
};

/** Multipliers offered in Settings → Display. */
export const FONT_SCALES = [0.85, 1, 1.15, 1.3, 1.5, 1.75] as const;

export const FONT_SCALE_LABELS: Record<number, string> = {
  0.85: 'Small',
  1: 'Default',
  1.15: 'Large',
  1.3: 'Larger',
  1.5: 'Huge',
  1.75: 'Max',
};

/** Arabic size for a given user scale, clamped to the readable band. */
export function arabicSize(scale: number): number {
  const { defaultSize, minSize, maxSize } = typography.arabic;
  return Math.round(Math.min(maxSize, Math.max(minSize, defaultSize * scale)));
}

/** Line height that keeps harakat from colliding as the size grows. */
export function arabicLineHeight(size: number): number {
  return Math.round(size * 2);
}
