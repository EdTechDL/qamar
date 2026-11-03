// Arabic grapheme segmentation.
//
// A "cluster" is one base character plus every combining mark that hangs off
// it — so a fatha, a shadda+kasra pair, or a superscript alef never gets
// separated from the letter it sits on. That is the unit the mistake
// highlighter selects, which is what lets a teacher's correction land on a
// single harakah rather than a whole word.
//
// Hand-rolled rather than `Intl.Segmenter` because Hermes (React Native) does
// not ship it, and because the ranges below are the whole of what Quranic
// orthography uses — there is nothing to be gained from a general engine.

/** Combining marks: harakat, tanween, Quranic annotation and waqf signs. */
function isCombiningMark(code: number): boolean {
  return (
    (code >= 0x0610 && code <= 0x061a) || // Arabic signs (sallallahou alayhe...)
    (code >= 0x064b && code <= 0x065f) || // fathatan..wavy hamza below
    code === 0x0670 || // superscript alef
    (code >= 0x06d6 && code <= 0x06dc) || // small high ligatures
    (code >= 0x06df && code <= 0x06e8) || // small high marks
    (code >= 0x06ea && code <= 0x06ed) || // empty centre / small marks
    code === 0x0640 || // tatweel — visually part of the letter it extends
    code === 0x200d || // ZWJ
    code === 0x200c || // ZWNJ
    code === 0xfe00 // variation selector
  );
}

/**
 * Splits text into clusters. Concatenating the result reproduces the input
 * exactly — the highlighter relies on that to map indices back to characters.
 */
export function segmentArabic(text: string): string[] {
  const out: string[] = [];
  const chars = [...text]; // code points, so astral chars stay whole

  for (const ch of chars) {
    const code = ch.codePointAt(0) ?? 0;
    if (out.length > 0 && isCombiningMark(code)) {
      out[out.length - 1] += ch;
    } else {
      out.push(ch);
    }
  }
  return out;
}

/** True when a cluster is whitespace — the word separator. */
export function isSpaceCluster(cluster: string): boolean {
  return /^\s+$/u.test(cluster);
}

/**
 * Expands [from, to] outward to whole-word boundaries. Used when the user
 * wants the word rather than the letter their finger landed on.
 */
export function expandToWord(
  clusters: readonly string[],
  from: number,
  to: number,
): { from: number; to: number } {
  let start = Math.max(0, Math.min(from, to));
  let end = Math.min(clusters.length - 1, Math.max(from, to));

  while (start > 0 && !isSpaceCluster(clusters[start - 1]!)) start -= 1;
  while (end < clusters.length - 1 && !isSpaceCluster(clusters[end + 1]!)) end += 1;

  return { from: start, to: end };
}

/** Word index ranges, for word-level hit testing. */
export function wordRanges(clusters: readonly string[]): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = [];
  let start: number | null = null;

  clusters.forEach((cluster, i) => {
    if (isSpaceCluster(cluster)) {
      if (start !== null) {
        out.push({ from: start, to: i - 1 });
        start = null;
      }
    } else if (start === null) {
      start = i;
    }
  });

  if (start !== null) out.push({ from: start, to: clusters.length - 1 });
  return out;
}

/** The substring a mark covers, for previews and accessibility labels. */
export function sliceClusters(clusters: readonly string[], from: number, to: number): string {
  return clusters.slice(Math.max(0, from), Math.min(clusters.length, to + 1)).join('');
}
