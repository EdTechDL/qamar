// Repeat + speed pickers for the review session. Segmented rows rather than
// steppers so any value is one tap away (SPEC §15.2).

import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AYAH_REPEAT_CHOICES,
  RATE_CHOICES,
  SET_REPEAT_CHOICES,
  repeatLabel,
  useAudioPrefsStore,
} from '@stores/audioPrefs';
import { light } from '@theme/colors';

interface SegmentProps<T extends number> {
  label: string;
  hint?: string;
  choices: readonly T[];
  value: T;
  format: (v: T) => string;
  onChange: (v: T) => void;
}

function Segment<T extends number>({
  label,
  hint,
  choices,
  value,
  format,
  onChange,
}: SegmentProps<T>) {
  return (
    <View style={styles.block}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <View style={styles.segment}>
        {choices.map((choice) => {
          const active = choice === value;
          return (
            <Pressable
              key={choice}
              onPress={() => onChange(choice)}
              style={[styles.cell, active && styles.cellActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.cellText, active && styles.cellTextActive]}>
                {format(choice)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function RepeatControls({ compact = false }: { compact?: boolean }) {
  const ayahRepeat = useAudioPrefsStore((s) => s.ayahRepeat);
  const setAyahRepeat = useAudioPrefsStore((s) => s.setAyahRepeat);
  const setRepeat = useAudioPrefsStore((s) => s.setRepeat);
  const setSetRepeat = useAudioPrefsStore((s) => s.setSetRepeat);
  const rate = useAudioPrefsStore((s) => s.rate);
  const setRate = useAudioPrefsStore((s) => s.setRate);

  return (
    <View style={styles.host}>
      <Segment
        label="Repeat each ayah"
        hint="before moving on"
        choices={AYAH_REPEAT_CHOICES}
        value={ayahRepeat as (typeof AYAH_REPEAT_CHOICES)[number]}
        format={repeatLabel}
        onChange={setAyahRepeat}
      />
      <Segment
        label="Repeat the maqra"
        hint="whole portion"
        choices={SET_REPEAT_CHOICES}
        value={setRepeat as (typeof SET_REPEAT_CHOICES)[number]}
        format={repeatLabel}
        onChange={setSetRepeat}
      />
      {!compact && (
        <Segment
          label="Speed"
          choices={RATE_CHOICES}
          value={rate as (typeof RATE_CHOICES)[number]}
          format={(v) => `${v}×`}
          onChange={setRate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    gap: 14,
  },
  block: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: light.textMuted,
    opacity: 0.8,
  },
  segment: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.surface,
    borderWidth: 1,
    borderColor: light.border,
    minHeight: 44,
  },
  cellActive: {
    backgroundColor: light.accent,
    borderColor: light.accent,
  },
  cellText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: light.text,
  },
  cellTextActive: {
    color: '#FFFFFF',
  },
});
