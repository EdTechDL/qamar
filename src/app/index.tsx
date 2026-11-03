// Today screen. SPEC §10.2.
//
// Free-mode default: nothing is nudged — progress, the streak, and a way into
// the mushaf. Guided features stay behind explicit toggles in Settings.

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Settings } from 'lucide-react-native';
import { ScrollView } from 'react-native';
import { ProgressBar } from '@components/primitives/ProgressBar';
import { MAX_CONTENT_WIDTH } from '@components/primitives/Screen';
import { AgingSurahList } from '@components/tracking/AgingSurahList';
import { ClassCheckIn } from '@components/tracking/ClassCheckIn';
import { PlanCard } from '@components/tracking/PlanCard';
import { StreakCard } from '@components/tracking/StreakCard';
import { useAgingSurahs } from '../hooks/useAgingSurahs';
import { useSurahProgress } from '../hooks/useSurahProgress';
import { useSettingsStore } from '@stores/settings';
import { light } from '@theme/colors';

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { overall } = useSurahProgress();
  const features = useSettingsStore((s) => s.features);
  const aging = useAgingSurahs();
  const pct = Math.round((overall.memorized / overall.total) * 1000) / 10;

  return (
    <ScrollView
      style={styles.host}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 16,
        alignItems: 'center',
      }}
    >
      <View style={styles.inner}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.title}>Qamar</Text>
            <Text style={styles.tag}>Memorize the Quran, one small step at a time.</Text>
          </View>
          <View style={styles.brandActions}>
            <Pressable onPress={() => router.push('/progress')} hitSlop={12}>
              <CalendarDays size={20} color={light.textMuted} />
            </Pressable>
            <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
              <Settings size={20} color={light.textMuted} />
            </Pressable>
          </View>
        </View>

        <ClassCheckIn />

        <StreakCard />

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Memorized</Text>
          <Text style={styles.statValue}>
            {overall.memorized.toLocaleString('en-US')}
            <Text style={styles.statValueMuted}> / {overall.total.toLocaleString('en-US')}</Text>
          </Text>
          <Text style={styles.statPct}>{pct.toFixed(1)}%</Text>
          <ProgressBar
            percent={pct}
            learningPercent={(overall.learning / overall.total) * 100}
            height={8}
          />
        </View>

        {features.revisionReminder && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>To review</Text>
            <AgingSurahList items={aging} />
          </View>
        )}

        {features.assistedPlanning && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Plan</Text>
            <PlanCard />
          </View>
        )}

        <Pressable style={styles.cta} onPress={() => router.push('/browse')}>
          <Text style={styles.ctaLabel}>Browse the Quran</Text>
          <Text style={styles.ctaArrow}>›</Text>
        </Pressable>

        <View style={styles.quickRow}>
          <Pressable style={styles.quick} onPress={() => router.push('/browse/maqra')}>
            <Text style={styles.quickLabel}>Maqras</Text>
            <Text style={styles.quickHint}>Review with repeat</Text>
          </Pressable>
          <Pressable style={styles.quick} onPress={() => router.push('/surahs')}>
            <Text style={styles.quickLabel}>Surahs</Text>
            <Text style={styles.quickHint}>Read and mark</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: light.bg,
  },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    gap: 14,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  brandActions: {
    flexDirection: 'row',
    gap: 18,
    paddingTop: 6,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    color: light.text,
  },
  tag: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: light.textMuted,
    marginTop: 3,
  },
  statCard: {
    backgroundColor: light.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: light.border,
    gap: 6,
  },
  statLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: light.text,
  },
  statValueMuted: {
    fontFamily: 'Inter_400Regular',
    fontSize: 20,
    color: light.textMuted,
  },
  statPct: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: light.accent,
    marginBottom: 6,
  },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: light.accent,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 4,
    minHeight: 56,
  },
  ctaLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  ctaArrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    color: '#FFFFFF',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quick: {
    flex: 1,
    backgroundColor: light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 2,
    minHeight: 72,
  },
  quickLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: light.text,
  },
  quickHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    color: light.textMuted,
  },
});
