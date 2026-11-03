// Settings screen. SPEC §10.6.

import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useSettingsStore,
  type FeatureFlags,
  type ReminderConfig,
} from '@stores/settings';
import { useActivityStore } from '@stores/activity';
import { RepeatControls } from '@components/audio/RepeatControls';
import { QariPicker } from '@components/audio/QariPicker';
import { light } from '@theme/colors';
import { FONT_SCALES, FONT_SCALE_LABELS, arabicSize } from '@theme/typography';

interface ToggleRow {
  key: keyof FeatureFlags;
  label: string;
  description: string;
}

const FEATURE_ROWS: readonly ToggleRow[] = [
  {
    key: 'revisionReminder',
    label: 'Review reminders',
    description:
      'Lists surahs on the home screen once their last memorization is older than the delay you set.',
  },
  {
    key: 'assistedPlanning',
    label: 'Assisted planning',
    description:
      'A personal plan with a pace and time estimate that updates as you go.',
  },
];

interface ReminderFieldDef {
  key: keyof ReminderConfig;
  label: string;
  unit: string;
  min: number;
  max: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const REMINDER_FIELDS: readonly ReminderFieldDef[] = [
  { key: 'remindAfterDays', label: 'Remind after', unit: 'days', min: 1, max: 365 },
  { key: 'frequencyDays', label: 'Frequency', unit: 'days', min: 1, max: 90 },
  { key: 'hourOfDay', label: 'Reminder hour', unit: 'h', min: 0, max: 23 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const features = useSettingsStore((s) => s.features);
  const setFeature = useSettingsStore((s) => s.setFeature);
  const reminder = useSettingsStore((s) => s.reminder);
  const setReminder = useSettingsStore((s) => s.setReminder);
  const fontScale = useSettingsStore((s) => s.fontScale);
  const setFontScale = useSettingsStore((s) => s.setFontScale);
  const classWeekday = useActivityStore((s) => s.classWeekday);
  const setClassWeekday = useActivityStore((s) => s.setClassWeekday);
  const classAskAfterHour = useActivityStore((s) => s.classAskAfterHour);
  const setClassAskAfterHour = useActivityStore((s) => s.setClassAskAfterHour);

  return (
    <View style={styles.host}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>Reading size</Text>
        <View style={styles.card}>
          <Text
            style={[
              styles.preview,
              { fontSize: arabicSize(fontScale), lineHeight: arabicSize(fontScale) * 1.9 },
            ]}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
          <View style={styles.scaleRow}>
            {FONT_SCALES.map((scale) => {
              const active = Math.abs(scale - fontScale) < 0.01;
              return (
                <Pressable
                  key={scale}
                  onPress={() => setFontScale(scale)}
                  style={[styles.scaleCell, active && styles.scaleCellActive]}
                >
                  <Text style={[styles.scaleText, active && styles.scaleTextActive]}>
                    {FONT_SCALE_LABELS[scale] ?? `${scale}×`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Reciter</Text>
        <View style={styles.card}>
          <QariPicker />
        </View>

        <Text style={styles.sectionLabel}>Repeat defaults</Text>
        <View style={styles.card}>
          <RepeatControls />
        </View>

        <Text style={styles.sectionLabel}>Class day</Text>
        <View style={styles.card}>
          <Text style={styles.rowDesc}>
            On this day Qamar asks once, after the hour below, whether you made it
            to class. It never asks about days that already passed.
          </Text>
          <View style={styles.scaleRow}>
            {WEEKDAYS.map((label, i) => {
              const active = i === classWeekday;
              return (
                <Pressable
                  key={label}
                  onPress={() => setClassWeekday(i)}
                  style={[styles.dayCell, active && styles.scaleCellActive]}
                >
                  <Text style={[styles.scaleText, active && styles.scaleTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>Ask after</Text>
            <View style={styles.reminderInputWrap}>
              <TextInput
                value={String(classAskAfterHour)}
                onChangeText={(t) => {
                  const n = Number(t.replace(/[^\d]/g, ''));
                  if (!Number.isNaN(n)) setClassAskAfterHour(n);
                }}
                keyboardType="number-pad"
                style={styles.reminderInput}
                maxLength={2}
              />
              <Text style={styles.reminderUnit}>h</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Features</Text>
        {FEATURE_ROWS.map((row) => (
          <View key={row.key} style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Switch
                value={features[row.key]}
                onValueChange={(v) => setFeature(row.key, v)}
                trackColor={{ false: light.border, true: light.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={styles.rowDesc}>{row.description}</Text>
          </View>
        ))}

        {features.revisionReminder && (
          <>
            <Text style={styles.sectionLabel}>Review reminders</Text>
            <View style={styles.card}>
              {REMINDER_FIELDS.map((f, i) => (
                <View
                  key={f.key}
                  style={[styles.reminderRow, i > 0 && styles.reminderRowDivider]}
                >
                  <Text style={styles.reminderLabel}>{f.label}</Text>
                  <View style={styles.reminderInputWrap}>
                    <TextInput
                      value={String(reminder[f.key])}
                      onChangeText={(t) => {
                        const n = Number(t.replace(/[^\d]/g, ''));
                        if (!Number.isNaN(n)) setReminder(f.key, n);
                      }}
                      keyboardType="number-pad"
                      style={styles.reminderInput}
                      maxLength={3}
                    />
                    <Text style={styles.reminderUnit}>{f.unit}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: light.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scaleCell: {
    flexGrow: 1,
    flexBasis: '30%',
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.bg,
    borderWidth: 1,
    borderColor: light.border,
    minHeight: 44,
  },
  dayCell: {
    flexGrow: 1,
    flexBasis: '12%',
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.bg,
    borderWidth: 1,
    borderColor: light.border,
    minHeight: 44,
  },
  scaleCellActive: {
    backgroundColor: light.accent,
    borderColor: light.accent,
  },
  scaleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: light.text,
  },
  scaleTextActive: { color: '#FFFFFF' },
  host: {
    flex: 1,
    backgroundColor: light.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: light.border,
  },
  back: {
    fontSize: 28,
    fontFamily: 'Inter_600SemiBold',
    color: light.text,
    width: 24,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: light.text,
    textAlign: 'center',
  },
  body: {
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 2,
  },
  card: {
    backgroundColor: light.surface,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: light.text,
  },
  rowDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: light.textMuted,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  reminderRowDivider: {
    borderTopWidth: 1,
    borderTopColor: light.borderMuted,
  },
  reminderLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: light.text,
  },
  reminderInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: light.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: light.bg,
  },
  reminderInput: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: light.text,
    minWidth: 36,
    padding: 0,
    textAlign: 'right',
  },
  reminderUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: light.textMuted,
  },
});
