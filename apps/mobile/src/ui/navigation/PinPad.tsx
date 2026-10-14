import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { fonts, radii, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';

export interface PinPadProps {
  value: string;
  onChange: (v: string) => void;
  /** 6 = PIN */
  length?: number;
  error?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

/** Teclado PIN compartido por Lock y Setup. */
export function PinPad({ value, onChange, length = 6, error = false }: PinPadProps) {
  const { colors } = useAppTheme();
  const haptics = useHaptics();

  const press = (k: string) => {
    if (k === 'back') {
      haptics.light();
      onChange(value.slice(0, -1));
      return;
    }
    if (!k || value.length >= length) return;
    haptics.selection();
    onChange(value + k);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          gap: spacing.xl,
        },
        dots: {
          flexDirection: 'row',
          gap: spacing.md,
        },
        dotsError: {
          opacity: 1,
        },
        dot: {
          width: 16,
          height: 16,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: 'transparent',
        },
        dotFilled: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        pad: {
          width: 288,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: spacing.sm,
        },
        key: {
          width: 84,
          height: 64,
          borderRadius: radii.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        keyPressed: {
          backgroundColor: colors.surfaceAlt,
        },
        keyLabel: {
          fontFamily: fonts.mono,
          fontSize: 24,
          fontWeight: '600',
          color: colors.text,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.dots, error && styles.dotsError]}>
        {Array.from({ length }, (_, i) => (
          <Animated.View
            key={i}
            entering={FadeIn.duration(120)}
            style={[styles.dot, i < value.length && styles.dotFilled]}
          />
        ))}
      </View>
      <View style={styles.pad}>
        {KEYS.map((k, i) =>
          k === '' ? (
            <View key={`spacer-${i}`} style={styles.key} />
          ) : (
            <Pressable
              key={`k-${i}`}
              onPress={() => press(k)}
              accessibilityRole="button"
              accessibilityLabel={k === 'back' ? 'Borrar' : k}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            >
              {k === 'back' ? (
                <Ionicons name="backspace-outline" size={24} color={colors.text} />
              ) : (
                <Text style={styles.keyLabel}>{k}</Text>
              )}
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
}
