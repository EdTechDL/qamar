// Shared screen chrome: safe-area padding, a back row, and a content width
// cap so landscape and desktop don't stretch text to unreadable line lengths.

import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { light } from '@theme/colors';

/** Beyond this, content is centred rather than stretched. */
export const MAX_CONTENT_WIDTH = 720;

interface Props {
  title?: string;
  subtitle?: string;
  /** Shows a back chevron. Defaults to true when a title is given. */
  back?: boolean;
  right?: ReactNode;
  scroll?: boolean;
  children: ReactNode;
}

export function Screen({ title, subtitle, back, right, scroll = true, children }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const showBack = back ?? Boolean(title);

  // Side gutters grow with the viewport so landscape gets breathing room.
  const gutter = width > MAX_CONTENT_WIDTH ? 24 : 16;

  const header = (title || right) && (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBack && (
          <Pressable onPress={() => router.back()} hitSlop={14} style={styles.back}>
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
        )}
        <View style={styles.headerText}>
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {right}
    </View>
  );

  const body = (
    <View style={[styles.inner, { maxWidth: MAX_CONTENT_WIDTH }]}>
      {header}
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View style={[styles.host, { paddingTop: insets.top + 8, paddingHorizontal: gutter }]}>
        {body}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.host}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: gutter,
        alignItems: 'center',
      }}
    >
      {body}
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
    alignSelf: 'center',
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  headerText: {
    flexShrink: 1,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    lineHeight: 30,
    color: light.text,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: light.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: light.textMuted,
    marginTop: 1,
  },
});
