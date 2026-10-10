import { ActivityIndicator, type ColorValue } from 'react-native';
import { palette } from '@/core/theme/theme';

export interface SpinnerProps {
  color?: ColorValue;
  size?: 'small' | 'large';
}

export function Spinner({ color = palette.primary, size = 'large' }: SpinnerProps) {
  return <ActivityIndicator color={color} size={size} accessibilityLabel="Cargando" />;
}
