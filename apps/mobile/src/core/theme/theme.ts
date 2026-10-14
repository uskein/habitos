/**
 * theme.ts — SSOT de identidad visual «Pulse Clay».
 * Derivado de Artefactos/documentación/Diseño Visual/manual-identidad-visual.md.
 * ÚNICO archivo del repo con hex literales (regla 7 de ESTRUCTURA_DIRECTORIOS.md).
 */

export const palette = {
  primary: '#6D4BF5',
  primaryHover: '#5B3AE0',
  primaryActive: '#4F32CC',
  primaryDisabledBg: '#C9BEFD',
  primaryDisabledText: '#8B84A6',
  secondary: '#2EC4B6',
  streak: '#FF6B6B',
  award: '#F59E0B',
  bg: '#F7F5FF',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEBFF',
  text: '#17122B',
  textMuted: '#67617E',
  border: '#E4DFF3',
  success: '#22C55E',
  error: '#DC2626',
  dangerSoft: '#FEE2E2',
  dangerLegend: '#FECACA',
  secondarySoft: '#DDF7F4',
  awardSoft: '#FEF3C7',
  textFaded: '#9B95B5',
  track: '#DDD5FB',
  /** Tono intermedio primary → primaryActive (rampas, heatmaps). Token del manual. */
  primarySoft: '#8B78FF',
  /** V2 — relleno de área en gráficos (primary @12%). Solo vistas de stats. */
  chartArea: 'rgba(109,75,245,0.12)',
} as const;

/** Velos V2 (máscaras sobre contenido) — contador de carrusel, dots, overlays. */
export const veils = {
  /** texto sobre foto (manual §8.2: velo text 55 %) */
  dark: 'rgba(23,18,43,0.55)',
  /** dots inactivos del carrusel */
  light: 'rgba(255,255,255,0.55)',
} as const;

export const badgeTints = {
  danger: { bg: '#FEE2E2', text: '#B91C1C' },
  success: { bg: '#DCFCE7', text: '#15803D' },
  warning: { bg: '#FEF3C7', text: '#B45309' },
  purple: { bg: '#EDE9FE', text: '#6D28D9' },
} as const;

/** V2 · HU-4 — swatches de HABIT_COLOR_TOKENS (shared) para el selector de color. */
export const habitSwatches = {
  'primary-soft': badgeTints.purple.bg,
  'success-soft': badgeTints.success.bg,
  'warning-soft': badgeTints.warning.bg,
  'accent-soft': badgeTints.danger.bg,
} as const;

/**
 * Paleta oscura (M33) — derivada de la clara. Los 6 tokens definidos en el
 * manual (§2.2) se sobrescriben; el resto se hereda del tema claro.
 * SSOT de hex: solo en theme.ts (regla 7).
 */
export const darkPalette: Record<keyof typeof palette, string> = {
  ...palette,
  bg: '#12101C',
  surface: '#1C1930',
  surfaceAlt: '#241F3D',
  border: '#2E2947',
  text: '#F2EFFF',
  textMuted: '#9B95B5',
  textFaded: '#6D6788',
  track: '#2E2947',
  primarySoft: '#8B78FF',
  primaryDisabledBg: '#3A3454',
  primaryDisabledText: '#6D6788',
  dangerSoft: '#3A1F24',
  dangerLegend: '#5C2A31',
  secondarySoft: '#12332F',
  awardSoft: '#3A2E14',
  chartArea: 'rgba(139,120,255,0.14)',
};

export const fonts = {
  display: 'Sora',
  body: 'Plus Jakarta Sans',
  mono: 'JetBrains Mono',
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/** Curvas — manual §animación */
export const easings = {
  std: [0.2, 0.8, 0.2, 1] as const,
  clay: [0.34, 1.56, 0.64, 1] as const,
};

export const durations = {
  d1: 120,
  d2: 180,
  d3: 240,
  d4: 320,
  d5: 400,
} as const;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Métricas de componentes — manual §componentes */
export const components = {
  buttonHeight: 52,
  inputHeight: 52,
  fabSize: 56,
  tabBarHeight: 64,
  rowHeight: 64,
  iconButton: 44,
  checkbox: 24,
  toggleWidth: 52,
  toggleHeight: 32,
  sheetHandleWidth: 36,
  sheetHandleHeight: 4,
  tabIcon: 24,
} as const;

/** Sombra clay suave (sobre superficies claras) */
export const shadows = {
  clay: {
    shadowColor: '#6D4BF5',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  fab: {
    shadowColor: '#6D4BF5',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
} as const;

export const theme = {
  palette,
  badgeTints,
  dark: darkPalette,
  fonts,
  fontWeights,
  easings,
  durations,
  radii,
  spacing,
  components,
  shadows,
} as const;

export type Theme = typeof theme;
