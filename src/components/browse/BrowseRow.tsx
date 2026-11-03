// One tappable row in the Juz / Hizb / Maqra / Surah browse lists.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@components/primitives/ProgressBar';
import { light } from '@theme/colors';

interface Props {
  /** Leading badge, e.g. the juz or maqra number. */
  badge: string | number;
  title: string;
  subtitle?: string;
  /** Right-aligned Arabic name, when there is one. */
  arabic?: string;
  percent: number;
  learningPercent?: number;
  /** Right-hand counter, e.g. "12 / 26". */
  meta?: string;
  onPress: () => void;
}

export function BrowseRow({
  badge,
  title,
  subtitle,
  arabic,
  percent,
  learningPercent,
  meta,
  onPress,
}: Props) {
  const done = percent >= 100;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}, ${Math.round(percent)} percent memorized`}
    >
      <View style={[styles.badge, done && styles.badgeDone]}>
        <Text style={[styles.badgeText, done && styles.badgeTextDone]}>{badge}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {arabic ? (
            <Text style={styles.arabic} numberOfLines={1}>
              {arabic}
            </Text>
          ) : null}
        </View>

        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        <View style={styles.progressRow}>
          <View style={styles.bar}>
            <ProgressBar percent={percent} learningPercent={learningPercent} />
          </View>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: light.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowPressed: {
    backgroundColor: light.surfaceMuted,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: light.surfaceMuted,
    borderWidth: 1,
    borderColor: light.border,
  },
  badgeDone: {
    backgroundColor: light.accent,
    borderColor: light.accent,
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: light.textMuted,
  },
  badgeTextDone: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    gap: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: light.text,
    flexShrink: 1,
  },
  arabic: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 17,
    color: light.textMuted,
    flexShrink: 0,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    color: light.textMuted,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  bar: {
    flex: 1,
  },
  meta: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11.5,
    color: light.textMuted,
    minWidth: 54,
    textAlign: 'right',
  },
  chevron: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    color: light.border,
  },
});
