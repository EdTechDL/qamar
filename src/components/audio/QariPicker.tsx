// Reciter picker. One row per qari; the selected one carries a check.
//
// Rows whose source publishes no audio licence say so, rather than hiding it
// behind a settings page nobody reads. See @audio/sources.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { QARIS } from '@audio/sources';
import { useAudioPrefsStore } from '@stores/audioPrefs';
import { light } from '@theme/colors';

export function QariPicker() {
  const qariId = useAudioPrefsStore((s) => s.qariId);
  const setQariId = useAudioPrefsStore((s) => s.setQariId);

  return (
    <View>
      {QARIS.map((qari, i) => {
        const active = qari.id === qariId;
        return (
          <Pressable
            key={qari.id}
            onPress={() => setQariId(qari.id)}
            style={[styles.row, i > 0 && styles.divider]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.text}>
              <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
                {qari.displayName}
              </Text>
              <Text style={styles.style} numberOfLines={1}>
                {qari.style}
                {qari.unlicensed ? ' · no published licence' : ''}
              </Text>
            </View>
            {active ? <Check size={18} color={light.accent} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    minHeight: 52,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: light.borderMuted,
  },
  text: { flexShrink: 1 },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: light.text,
  },
  nameActive: { color: light.accent },
  style: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: light.textMuted,
    marginTop: 1,
  },
});
