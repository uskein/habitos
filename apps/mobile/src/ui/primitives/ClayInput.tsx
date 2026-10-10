import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { fonts, palette, radii, components } from '@/core/theme/theme';

export interface ClayInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  helper?: string;
}

/** Input clay h52 r16 — focus con borde primary, error con borde error. */
export function ClayInput({ label, error, helper, onFocus, onBlur, ...rest }: ClayInputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? palette.error : focused ? palette.primary : palette.border;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor={palette.textMuted}
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

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 14,
    color: palette.text,
  },
  input: {
    height: components.inputHeight,
    borderRadius: radii.md,
    borderWidth: 1.5,
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: 16,
    color: palette.text,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.error,
  },
  helper: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textMuted,
  },
});
