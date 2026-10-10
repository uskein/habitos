import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { durations, easings, palette, radii } from '@/core/theme/theme';

export interface ClayBarsDatum {
  label: string;
  /** 0–100 */
  value: number;
  caption?: string;
}

export interface ClayBarsProps {
  data: ClayBarsDatum[];
  height?: number;
  barWidth?: number;
  accessibilityLabel?: string;
}

/**
 * ClayBars (V2 · manual §8.2) — altura 160 px, barra 16 px r8, fill gradiente
 * primary → secondary sobre track #DDD5FB. Animación scaleY 320 ms easing.std
 * con retardo escalonado 50 ms por barra. Reduced-motion: altura final ya montada.
 */
export function ClayBars({
  data,
  height = 160,
  barWidth = 16,
  accessibilityLabel,
}: ClayBarsProps) {
  return (
    <View
      style={[styles.row, { height }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? 'Estadísticas por día'}
    >
      {data.map((d, i) => (
        <Bar key={`${d.label}-${i}`} datum={d} barWidth={barWidth} trackHeight={height - 22} index={i} />
      ))}
    </View>
  );
}

function Bar({
  datum,
  barWidth,
  trackHeight,
  index,
}: {
  datum: ClayBarsDatum;
  barWidth: number;
  trackHeight: number;
  index: number;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const clamped = Math.max(0, Math.min(100, datum.value));

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      index * 50,
      withTiming(1, { duration: 320, easing: Easing.bezier(...(easings.std as [number, number, number, number])) }),
    );
  }, [reduced, progress, index]);

  const fillStyle = useAnimatedStyle(() => ({
    height: `${clamped * progress.value}%`,
  }));

  return (
    <View style={styles.barCol} accessible accessibilityLabel={`${datum.label}: ${clamped}%`}>
      <View style={[styles.barTrack, { width: barWidth, height: trackHeight }]}>
        <Animated.View style={[styles.fill, fillStyle]}>
          <LinearGradient
            colors={[palette.primary, palette.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {datum.label}
      </Text>
      {datum.caption ? <Text style={styles.caption}>{datum.caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 7,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barTrack: {
    backgroundColor: palette.track,
    borderRadius: radii.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.textMuted,
  },
  caption: {
    fontSize: 9,
    fontFamily: 'JetBrains Mono',
    color: palette.textFaded,
  },
});

export const clayBarsDuration = durations.d4;
