import { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { fonts, radii, components } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';

export interface ClayInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  helper?: string;
}

/** Input clay h52 r16 — focus con borde primary, error con borde error. */
export function ClayInput({ label, error, helper, onFocus, onBlur, ...rest }: ClayInputProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    wrap: {
      gap: 6,
    },
    label: {
      fontFamily: fonts.body,
      fontWeight: '600',
      fontSize: 14,
      color: colors.text,
    },
    input: {
      height: components.inputHeight,
      borderRadius: radii.md,
      borderWidth: 1.5,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      fontFamily: fonts.body,
      fontSize: 16,
      color: colors.text,
    },
    error: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.error,
    },
    helper: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
  }), [colors]);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        accessibilityLabel={label}
        style={[styles.input, { borderColor }]}
      />
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}
