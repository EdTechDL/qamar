// Bottom dock shown while marking mistakes: previews the selection, offers
// whole-word expansion, saves, or clears.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Highlighter } from 'lucide-react-native';
import { MAX_CONTENT_WIDTH } from '@components/primitives/Screen';
import { light } from '@theme/colors';

interface Props {
  /** The Arabic currently selected, for the preview. */
  excerpt: string;
  canSave: boolean;
  onSave: () => void;
  onExpandWord: () => void;
  onCancel: () => void;
  hint: string;
}

export function MistakeDock({ excerpt, canSave, onSave, onExpandWord, onCancel, hint }: Props) {
  return (
    <View style={styles.inner}>
      {canSave ? (
        <Text style={styles.preview} numberOfLines={1}>
          {excerpt}
        </Text>
      ) : (
        <View style={styles.hintRow}>
          <Highlighter size={15} color={light.textMuted} />
          <Text style={styles.hint}>{hint}</Text>
        </View>
      )}

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
  preview: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 22,
    color: light.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 30,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: light.textMuted,
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
    backgroundColor: light.accent,
    borderColor: light.accent,
  },
  saveDisabled: { opacity: 0.4 },
  saveText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
