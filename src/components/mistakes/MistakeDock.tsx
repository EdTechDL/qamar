// Bottom dock shown while marking mistakes: previews the selection, offers
// whole-word expansion, saves, clears — and always, always offers the way out.
//
// The exit lives here rather than in the scrolling content because the content
// is exactly what the user cannot reach: the ayah views capture drags so a
// highlight can be painted, which makes scrolling back up to a button at the
// top unreliable. A docked Done is reachable at any scroll position.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Highlighter } from 'lucide-react-native';
import { MAX_CONTENT_WIDTH } from '@components/primitives/Screen';
import { light } from '@theme/colors';

interface Props {
  /** The Arabic currently selected, for the preview. */
  excerpt: string;
  canSave: boolean;
  onSave: () => void;
  onExpandWord: () => void;
  onCancel: () => void;
  onDone: () => void;
  hint: string;
  /** Marks already saved in this portion. */
  savedCount: number;
}

export function MistakeDock({
  excerpt,
  canSave,
  onSave,
  onExpandWord,
  onCancel,
  onDone,
  hint,
  savedCount,
}: Props) {
  return (
    <View style={styles.inner}>
      <View style={styles.topRow}>
        {canSave ? (
          <Text style={styles.preview} numberOfLines={1}>
            {excerpt}
          </Text>
        ) : (
          <View style={styles.hintRow}>
            <Highlighter size={15} color={light.textMuted} />
            <Text style={styles.hint} numberOfLines={2}>
              {hint}
            </Text>
          </View>
        )}

        <Pressable
          onPress={onDone}
          style={styles.done}
          accessibilityRole="button"
          accessibilityLabel="Finish marking mistakes"
        >
          <Check size={15} color="#FFFFFF" />
          <Text style={styles.doneText}>Done{savedCount > 0 ? ` · ${savedCount}` : ''}</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Pressable
          onPress={onExpandWord}
          disabled={!canSave}
          style={[styles.btn, !canSave && styles.btnDisabled]}
        >
          <Text style={styles.btnText}>Whole word</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          disabled={!canSave}
          style={[styles.btn, !canSave && styles.btnDisabled]}
        >
          <Text style={styles.btnText}>Clear</Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          disabled={!canSave}
          style={[styles.btn, styles.save, !canSave && styles.saveDisabled]}
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
  },
  preview: {
    flex: 1,
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 22,
    color: light.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  hintRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  hint: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    lineHeight: 16,
    color: light.textMuted,
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: light.accent,
    minHeight: 40,
    flexShrink: 0,
  },
  doneText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.surface,
    borderWidth: 1,
    borderColor: light.border,
    minHeight: 48,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.text,
  },
  save: {
    flex: 1.3,
    backgroundColor: light.accentSecondary,
    borderColor: light.accentSecondary,
  },
  saveDisabled: { opacity: 0.4 },
  saveText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
