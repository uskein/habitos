import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { durations, easings, palette, radii, shadows, spacing } from '@/core/theme/theme';

const CARD_WIDTH = 320;
const CARD_HEIGHT = 330;
const THRESHOLD = 90;
const MAX_ROTATION = 12;
const EASE_STD = Easing.bezier(...(easings.std as [number, number, number, number]));
const EASE_CLAY = Easing.bezier(...(easings.clay as [number, number, number, number]));

export interface SwipeCardProps {
  emoji?: string;
  /** V2 · visor de hitos — si hay foto, ocupa el slot del emoji (recorte r32). */
  imageUri?: string;
  title: string;
  subtitle?: string;
  onGuardar: () => void;
  onDescartar: () => void;
  /** Stamps y acciones personalizables (visor de hitos). */
  stampSave?: string;
  stampDiscard?: string;
  saveGlyph?: string;
  discardGlyph?: string;
  hint?: string;
  saveLabel?: string;
  discardLabel?: string;
  /** Altura de la card (visor de hitos usa más alto que el deck de motivos). */
  height?: number;
}

/**
 * SwipeCard (V2 · manual §8.2/8.3/8.4) — card 320×330 con arrastre y fricción,
 * rotación máx ±12°, escala 0.96, stamps «GUARDAR ★» (success) / «DESCARTAR ✕»
 * (error) con opacidad lineal hasta 90 px; release easing.clay 350 ms.
 * Reduced-motion: sin rotación. Siempre trae botones alternativos accesibles.
 */
export function SwipeCard({
  emoji = '🔥',
  imageUri,
  title,
  subtitle,
  onGuardar,
  onDescartar,
  stampSave = '★ GUARDAR',
  stampDiscard = '✕ DESCARTAR',
  saveGlyph = '★',
  discardGlyph = '✕',
  hint = 'Arrastra → guardar · ← descartar',
  saveLabel = 'Guardar motivación',
  discardLabel = 'Descartar motivación',
  height = CARD_HEIGHT,
}: SwipeCardProps) {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const scale = useSharedValue(1);

  const finish = (direction: 1 | -1, action: () => void) => {
    'worklet';
    x.value = withTiming(direction * 600, { duration: durations.d4, easing: EASE_STD }, (done) => {
      if (done) runOnJS(action)();
    });
    scale.value = withTiming(1, { duration: durations.d4 });
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onBegin(() => {
      scale.value = withTiming(0.96, { duration: durations.d2, easing: EASE_STD });
    })
    .onUpdate((e) => {
      x.value = e.translationX;
    })
    .onFinalize((e) => {
      scale.value = withTiming(1, { duration: durations.d3, easing: EASE_CLAY });
      if (e.translationX >= THRESHOLD) {
        finish(1, onGuardar);
      } else if (e.translationX <= -THRESHOLD) {
        finish(-1, onDescartar);
      } else {
        x.value = withTiming(0, { duration: 350, easing: EASE_CLAY });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = reduced ? 0 : (x.value / CARD_WIDTH) * MAX_ROTATION * 2;
    return {
      transform: [{ translateX: x.value }, { scale: scale.value }, { rotate: `${rotation}deg` }],
    };
  });

  const saveStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, x.value / THRESHOLD)),
  }));
  const discardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, -x.value / THRESHOLD)),
  }));

  return (
    <View style={[styles.outer, { height }]}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, shadows.clay, cardStyle]}>
          <Animated.View style={[styles.stamp, styles.stampSave, saveStyle]} pointerEvents="none">
            <Text style={[styles.stampText, styles.stampSaveText]}>{stampSave}</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampDiscard, discardStyle]} pointerEvents="none">
            <Text style={[styles.stampText, styles.stampDiscardText]}>{stampDiscard}</Text>
          </Animated.View>

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photo} accessibilityElementsHidden />
          ) : (
            <Text style={styles.emoji} accessibilityElementsHidden>
              {emoji}
            </Text>
          )}
          <Text style={styles.title} numberOfLines={4}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.actions}>
            <Text style={styles.hint}>{hint}</Text>
            <View style={styles.buttons}>
              <Text
                accessibilityRole="button"
                accessibilityLabel={discardLabel}
                style={[styles.actionBtn, styles.actionDiscard]}
                onPress={onDescartar}
              >
                {discardGlyph}
              </Text>
              <Text
                accessibilityRole="button"
                accessibilityLabel={saveLabel}
                style={[styles.actionBtn, styles.actionSave]}
                onPress={onGuardar}
              >
                {saveGlyph}
              </Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
  },
  card: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stamp: {
    position: 'absolute',
    top: 24,
    borderWidth: 3,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    zIndex: 5,
  },
  stampSave: {
    left: 20,
    borderColor: palette.success,
    transform: [{ rotate: '-8deg' }],
  },
  stampDiscard: {
    right: 20,
    borderColor: palette.error,
    transform: [{ rotate: '8deg' }],
  },
  stampText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stampSaveText: { color: palette.success },
  stampDiscardText: { color: palette.error },
  emoji: {
    fontSize: 56,
    marginTop: spacing.lg,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    backgroundColor: palette.surfaceAlt,
  },
  title: {
    fontFamily: 'Sora',
    fontSize: 20,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actions: {
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  hint: {
    fontSize: 12,
    color: palette.textFaded,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    textAlign: 'center',
    lineHeight: 56,
    fontSize: 22,
    fontWeight: '800',
    overflow: 'hidden',
  },
  actionDiscard: {
    backgroundColor: palette.dangerSoft,
    color: palette.error,
  },
  actionSave: {
    backgroundColor: palette.secondarySoft,
    color: palette.success,
  },
});
