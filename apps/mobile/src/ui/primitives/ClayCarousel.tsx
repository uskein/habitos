import { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { palette, radii, spacing, veils } from '@/core/theme/theme';

export interface ClayCarouselProps {
  children: React.ReactNode[];
  /** Altura del contenedor (default 200). */
  height?: number;
  /** Contenido no visual, anuncia el contador. */
  itemLabel?: (index: number, total: number) => string;
}

/**
 * ClayCarousel (V2 · manual §8.2) — snap 320 ms easing.std, dots de 8 px
 * (activo 20 px r pill blanco), contador mono «n/t» sobre velo text 55 %.
 * Accesibilidad: dots como pagetab con label «Foto n de t» (§8.4).
 */
export function ClayCarousel({ children, height = 200, itemLabel }: ClayCarouselProps) {
  const [index, setIndex] = useState(0);
  const width = useRef(0);
  const reduced = useReducedMotion() ?? false;
  const total = children.length;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width.current <= 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width.current);
    if (i !== index && i >= 0 && i < total) setIndex(i);
  };

  if (total <= 1) {
    return <View style={[styles.single, { height }]}>{children[0] ?? null}</View>;
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => (width.current = e.nativeEvent.layout.width)}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        accessibilityLabel={`Carrusel de ${total} fotos`}
      >
        {children.map((child, i) => (
          <View key={i} style={[styles.page, { width: width.current || 1 }]} accessibilityRole="image">
            {child}
          </View>
        ))}
      </Animated.ScrollView>

      <Animated.View
        entering={reduced ? undefined : FadeIn.duration(200)}
        exiting={reduced ? undefined : FadeOut.duration(200)}
        style={styles.counter}
      >
        <Text style={styles.counterText} accessibilityLiveRegion="polite">
          {`${index + 1}/${total}`}
        </Text>
      </Animated.View>

      <View style={styles.dots} accessibilityRole="tablist">
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            accessibilityRole="tab"
            accessibilityLabel={`Foto ${i + 1} de ${total}`}
            accessibilityState={{ selected: i === index }}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      <Text style={styles.srLabel} accessibilityLiveRegion="polite">
        {itemLabel ? itemLabel(index, total) : `Foto ${index + 1} de ${total}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: palette.surfaceAlt,
  },
  single: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: palette.surfaceAlt,
  },
  page: {
    height: '100%',
  },
  counter: {
    position: 'absolute',
    top: 8,
    right: 10,
    backgroundColor: veils.dark,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  counterText: {
    color: palette.surface,
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    fontWeight: '700',
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: veils.light,
  },
  dotActive: {
    width: 20,
    borderRadius: radii.pill,
    backgroundColor: palette.surface,
  },
  srLabel: {
    height: 0,
    opacity: 0,
  },
});
