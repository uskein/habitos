import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radii, shadows, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';

export interface ClayCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
}

/** Card clay r24 — surface del tema activo, borde sutil, sombra suave. */
export function ClayCard({
  children,
  style,
  elevated = true,
  onPress,
  onLongPress,
  accessibilityLabel,
}: ClayCardProps) {
  const { colors } = useAppTheme();

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
  }), [colors]);

  const card = (
    <View style={[styles.card, elevated && shadows.clay, style]}>{children}</View>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }}
      >
        {card}
      </Pressable>
    );
  }
  return card;
}
