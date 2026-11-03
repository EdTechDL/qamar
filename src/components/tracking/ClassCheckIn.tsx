// Class-day check-in. Appears on class day (Tuesday by default) after the
// configured hour, asks one question, and never asks again that day.
//
// Not a modal: SPEC §15.3 bans confirmations, and a blocking dialog on open
// is exactly the kind of friction that makes an ADHD user close the app. It
// is a dismissible card with two big answers.

import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useState } from 'react';
import { useClassCheckIn } from '../../hooks/useActivity';
import { useActivityStore } from '@stores/activity';
import { light } from '@theme/colors';

export function ClassCheckIn() {
  const { due, day } = useClassCheckIn();
  const answerClass = useActivityStore((s) => s.answerClass);
  const [dismissed, setDismissed] = useState(false);

  if (!due || dismissed) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.question}>Did you make it to class today?</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => answerClass(day, 'attended')}
          style={[styles.btn, styles.yes]}
          accessibilityRole="button"
        >
          <Text style={styles.yesText}>Yes</Text>
        </Pressable>
        <Pressable
          onPress={() => answerClass(day, 'missed')}
          style={styles.btn}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>No</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => setDismissed(true)} hitSlop={8}>
        <Text style={styles.later}>Ask me later</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.accentSecondary,
    padding: 16,
    gap: 12,
  },
  question: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: light.text,
  },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.surface,
    borderWidth: 1,
    borderColor: light.border,
    minHeight: 48,
  },
  yes: {
    backgroundColor: light.accent,
    borderColor: light.accent,
  },
  btnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: light.text,
  },
  yesText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  later: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    color: light.textMuted,
    textAlign: 'center',
  },
});
