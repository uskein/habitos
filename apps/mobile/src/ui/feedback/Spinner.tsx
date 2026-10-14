import { ActivityIndicator, type ColorValue } from 'react-native';
import { useAppTheme } from '@/core/theme/ThemeProvider';

export interface SpinnerProps {
  color?: ColorValue;
  size?: 'small' | 'large';
}

export function Spinner({ color, size = 'large' }: SpinnerProps) {
  const { colors } = useAppTheme();
  return <ActivityIndicator color={color ?? colors.primary} size={size} accessibilityLabel="Cargando" />;
}
