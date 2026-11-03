// Thin progress rail used by every browse row. Additive only — an empty bar
// is blank, never red (SPEC §15.5).

import { StyleSheet, View } from 'react-native';
import { light } from '@theme/colors';

interface Props {
  /** 0..100 */
  percent: number;
  /** 0..100, drawn behind the memorized fill. */
  learningPercent?: number;
  height?: number;
}

export function ProgressBar({ percent, learningPercent = 0, height = 6 }: Props) {
  const memo = Math.max(0, Math.min(100, percent));
  const learning = Math.max(0, Math.min(100 - memo, learningPercent));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      {learning > 0 && (
        <View
          style={[
            styles.fill,
            {
              width: `${memo + learning}%`,
              backgroundColor: light.state.learningBg,
              borderRadius: height / 2,
            },
          ]}
        />
      )}
      {memo > 0 && (
        <View
          style={[
            styles.fill,
            {
              width: `${memo}%`,
              backgroundColor: light.accent,
              borderRadius: height / 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: light.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});
