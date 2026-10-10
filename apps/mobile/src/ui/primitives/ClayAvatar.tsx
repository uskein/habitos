import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '@/core/theme/theme';

export interface ClayAvatarProps {
  name: string;
  size?: 40 | 56 | 88;
  photoUri?: string | null;
  /** Muestra el badge cámara (Perfil · HU-14). */
  onPressCamera?: () => void;
  style?: StyleProp<ViewStyle>;
}

const SIZES = { 40: 40, 56: 56, 88: 88 } as const;

/** Iniciales: primeras letras de las dos primeras palabras (fallback gradiente V1). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '·';
  const second = parts[1];
  if (!second) return first.slice(0, 2).toUpperCase();
  return ((first[0] ?? '') + (second[0] ?? '')).toUpperCase();
}

/**
 * ClayAvatar (V2 · manual §8.2 — base visual de ClayAvatarPicker) — círculo con
 * borde 3 px surface, gradiente primary → secondary e iniciales Sora 700.
 * Si hay photoUri se muestra la foto (FileSystem); sin ella → gradiente + iniciales.
 */
export function ClayAvatar({ name, size = 56, photoUri, onPressCamera, style }: ClayAvatarProps) {
  const dim = SIZES[size];
  const badgeSize = size === 88 ? 30 : 22;

  const body = photoUri ? (
    <Image
      source={{ uri: photoUri }}
      style={{ width: dim, height: dim, borderRadius: dim / 2, borderWidth: 3, borderColor: palette.surface }}
      accessibilityLabel={`Foto de perfil de ${name}`}
    />
  ) : (
    <LinearGradient
      colors={[palette.primary, palette.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.circle, { width: dim, height: dim, borderRadius: dim / 2 }]}
    >
      <Text style={[styles.initials, { fontSize: dim * 0.3 }]}>{initials(name)}</Text>
    </LinearGradient>
  );

  return (
    <View style={[styles.wrap, style]}>
      {body}
      {onPressCamera ? (
        <Pressable
          onPress={onPressCamera}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
          hitSlop={8}
          style={({ pressed }) => [
            styles.camera,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              transform: [{ scale: pressed ? 0.9 : 1 }],
            },
          ]}
        >
          <Text style={{ fontSize: badgeSize * 0.45 }}>📷</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: palette.surface,
    overflow: 'hidden',
  },
  initials: {
    fontFamily: 'Sora',
    fontWeight: '700',
    color: palette.surface,
  },
  camera: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    backgroundColor: palette.primary,
    borderWidth: 3,
    borderColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
