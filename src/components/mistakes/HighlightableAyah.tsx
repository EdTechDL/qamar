// One ayah rendered as selectable grapheme clusters.
//
// Splitting Arabic into per-cluster <Text> spans does NOT break cursive
// joining — the shaper joins across inline boundaries — which is what makes
// per-harakah highlighting possible at all. Verified against Noto Naskh.
//
// Hit testing: on web the drag reads `document.elementFromPoint` and pulls the
// cluster index off a data attribute, which is exact and needs no layout
// bookkeeping. On native there is no such call, so clusters fall back to
// tap-to-set-start / tap-to-set-end, which still reaches a single harakah.

import { useCallback, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { coveredClusters, segmentArabic, type MistakeMark } from '@core/mistakes';
import { light } from '@theme/colors';
import { arabicLineHeight } from '@theme/typography';

export interface Selection {
  from: number;
  to: number;
}

interface Props {
  text: string;
  fontSize: number;
  marks: readonly MistakeMark[];
  /** When true, dragging selects clusters. */
  editing: boolean;
  selection: Selection | null;
  onSelectionChange: (s: Selection | null) => void;
  /** Tapping an existing highlight while editing. */
  onMarkPress?: (mark: MistakeMark) => void;
  /** Trailing content (the ayah number glyph). */
  suffix?: string;
  playing?: boolean;
  /** Unique per ayah on the page; scopes hit testing to this ayah. */
  ayahKey: string;
}

/**
 * Cluster index under a point, but only when the point is inside `ayahKey`.
 *
 * Indices restart at 0 for every ayah, so a drag that wanders into the next
 * ayah would otherwise come back with an index that means something else
 * entirely and silently mark the wrong span. Scoping the hit to the ayah that
 * started the drag makes the selection stop at the ayah boundary instead.
 */
function clusterIndexAtPoint(x: number, y: number, ayahKey: string): number | null {
  if (Platform.OS !== 'web') return null;
  const doc = (globalThis as { document?: Document }).document;
  if (!doc?.elementFromPoint) return null;
  // elementsFromPoint, not elementFromPoint: a transparent overlay (the
  // playback dock, a toast) sits above the text often enough that taking only
  // the topmost element would drop hits the user clearly intended.
  const stack: Element[] = doc.elementsFromPoint
    ? doc.elementsFromPoint(x, y)
    : [doc.elementFromPoint(x, y)].filter(
        Boolean as unknown as (e: Element | null) => e is Element,
      );

  for (const el of stack) {
    const hit = (el as HTMLElement).closest?.('[data-ci]') as HTMLElement | null;
    if (!hit) continue;
    if (hit.dataset?.ak !== ayahKey) continue;
    const raw = hit.dataset?.ci;
    if (raw === undefined) continue;
    const n = Number(raw);
    if (Number.isInteger(n)) return n;
  }
  return null;
}

/** Responder events carry page coords; elementFromPoint wants viewport ones. */
function viewportCoords(e: GestureResponderEvent): { x: number; y: number } {
  const ne = e.nativeEvent as unknown as {
    pageX?: number;
    pageY?: number;
    clientX?: number;
    clientY?: number;
    touches?: { clientX?: number; clientY?: number; pageX?: number; pageY?: number }[];
  };
  const touch = ne.touches?.[0];
  const clientX = touch?.clientX ?? ne.clientX;
  const clientY = touch?.clientY ?? ne.clientY;
  if (clientX !== undefined && clientY !== undefined) return { x: clientX, y: clientY };

  const pageX = touch?.pageX ?? ne.pageX ?? 0;
  const pageY = touch?.pageY ?? ne.pageY ?? 0;
  const g = globalThis as { scrollX?: number; scrollY?: number };
  return { x: pageX - (g.scrollX ?? 0), y: pageY - (g.scrollY ?? 0) };
}

export function HighlightableAyah({
  text,
  fontSize,
  marks,
  editing,
  selection,
  onSelectionChange,
  onMarkPress,
  suffix,
  playing = false,
  ayahKey,
}: Props) {
  const clusters = useMemo(() => segmentArabic(text), [text]);
  const covered = useMemo(() => coveredClusters(marks), [marks]);
  const anchor = useRef<number | null>(null);

  const handleStart = useCallback(
    (e: GestureResponderEvent) => {
      if (!editing) return;
      const { x, y } = viewportCoords(e);
      const i = clusterIndexAtPoint(x, y, ayahKey);
      if (i === null) return;

      // Tapping an existing highlight removes it rather than starting a drag.
      const existing = marks.find((m) => i >= m.from && i <= m.to);
      if (existing && onMarkPress) {
        anchor.current = null;
        onMarkPress(existing);
        return;
      }
      anchor.current = i;
      onSelectionChange({ from: i, to: i });
    },
    [editing, marks, onMarkPress, onSelectionChange, ayahKey],
  );

  const handleMove = useCallback(
    (e: GestureResponderEvent) => {
      if (!editing || anchor.current === null) return;
      const { x, y } = viewportCoords(e);
      const i = clusterIndexAtPoint(x, y, ayahKey);
      if (i === null) return;
      const a = anchor.current;
      onSelectionChange({ from: Math.min(a, i), to: Math.max(a, i) });
    },
    [editing, onSelectionChange, ayahKey],
  );

  const handleEnd = useCallback(() => {
    anchor.current = null;
  }, []);

  // Native has no elementFromPoint, so each cluster takes its own press:
  // first tap sets the start, second extends to it.
  const handleClusterPress = useCallback(
    (i: number) => {
      if (!editing || Platform.OS === 'web') return;
      const existing = marks.find((m) => i >= m.from && i <= m.to);
      if (existing && onMarkPress) return onMarkPress(existing);
      if (selection && selection.from === selection.to && selection.from !== i) {
        onSelectionChange({
          from: Math.min(selection.from, i),
          to: Math.max(selection.from, i),
        });
      } else {
        onSelectionChange({ from: i, to: i });
      }
    },
    [editing, marks, onMarkPress, onSelectionChange, selection],
  );

  const responderProps = editing
    ? {
        onStartShouldSetResponder: () => true,
        onMoveShouldSetResponder: () => true,
        onResponderGrant: handleStart,
        onResponderStart: handleStart,
        onResponderMove: handleMove,
        onResponderRelease: handleEnd,
        onResponderTerminate: handleEnd,
      }
    : {};

  return (
    <View
      {...responderProps}
      // Stops the page from scrolling out from under a highlight drag.
      style={[editing && styles.editing, playing && styles.playing]}
    >
      <Text
        style={[styles.arabic, { fontSize, lineHeight: arabicLineHeight(fontSize) }]}
        selectable={false}
      >
        {clusters.map((cluster, i) => {
          const inMark = covered.has(i);
          const inSelection = selection !== null && i >= selection.from && i <= selection.to;
          return (
            <Text
              key={i}
              dataSet={{ ci: i, ak: ayahKey }}
              onPress={editing && Platform.OS !== 'web' ? () => handleClusterPress(i) : undefined}
              style={inSelection ? styles.selected : inMark ? styles.marked : undefined}
            >
              {cluster}
            </Text>
          );
        })}
        {suffix ? <Text style={styles.marker}>{suffix}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  editing: {
    // RNW passes this through; it is a no-op on native.
    touchAction: 'none',
    userSelect: 'none',
  } as object,
  playing: {
    backgroundColor: light.state.playingBg,
    borderRadius: 10,
  },
  arabic: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: light.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  // A teacher's correction: amber underline + tint. Deliberately not red —
  // this marks something to practise, not a failure (SPEC §15.5).
  marked: {
    backgroundColor: light.state.learningBg,
    color: light.state.learningMarker,
  },
  selected: {
    backgroundColor: light.accentSecondary,
    color: '#FFFFFF',
  },
  marker: {
    color: light.accentSecondary,
  },
});
