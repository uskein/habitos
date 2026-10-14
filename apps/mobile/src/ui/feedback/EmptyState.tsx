import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Glyph emoji o Ionicon renderizado por el caller */
  blob?: string;
  action?: React.ReactNode;
}

/** Empty state con blob clay + copy empática (estilo manual). */
export function EmptyState({ title, description, blob = '◌', action }: EmptyStateProps) {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.xl,
        },
        blob: {
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        },
        blobGlyph: {
          fontSize: 40,
          color: colors.primary,
        },
        title: {
          fontFamily: fonts.display,
          fontWeight: '700',
          fontSize: 18,
          color: colors.text,
          textAlign: 'center',
        },
        desc: {
          fontFamily: fonts.body,
          fontSize: 14,
          color: colors.textMuted,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={styles.blob}>
        <Text style={styles.blobGlyph}>{blob}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {action}
    </View>
  );
}
