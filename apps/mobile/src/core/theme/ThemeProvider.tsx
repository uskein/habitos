import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { prefs, PrefKeys } from '@/core/storage/preferences';
import { darkPalette, palette } from '@/core/theme/theme';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ActivePalette = typeof palette;

interface ThemeContextValue {
  /** Paleta resuelta (según modo + esquema del sistema). */
  colors: ActivePalette;
  /** Modo preferido del usuario (persistido en MMKV). */
  mode: ThemeMode;
  /** true si el tema resuelto es oscuro. */
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Lee el modo persistido (default 'system' — sigue al sistema). */
export function initialThemeMode(): ThemeMode {
  const stored = prefs.getString(PrefKeys.themeMode);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

/** Proveedor del tema — M33 (modo oscuro). Envuelve la app en el root layout. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialThemeMode);

  useEffect(() => {
    prefs.set(PrefKeys.themeMode, mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved: 'light' | 'dark' =
      mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
    const isDark = resolved === 'dark';
    return {
      colors: isDark ? (darkPalette as unknown as ActivePalette) : palette,
      mode,
      isDark,
      setMode: setModeState,
    };
  }, [mode, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Hook del tema activo. Fuera de <ThemeProvider> cae al tema claro (no rompe). */
export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  return { colors: palette, mode: 'light', isDark: false, setMode: () => {} };
}
