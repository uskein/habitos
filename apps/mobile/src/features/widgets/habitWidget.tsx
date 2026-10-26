import { Appearance } from 'react-native';
import {
  FlexWidget,
  TextWidget,
  registerWidgetTaskHandler,
  requestWidgetUpdate,
} from 'react-native-android-widget';
import { prefs, PrefKeys } from '@/core/storage/preferences';
import { darkPalette, palette } from '@/core/theme/theme';

/**
 * M34 · Widget de Android (HabitWidget).
 * El widget vive fuera del árbol React de la app: lee colores del Design
 * System (theme.ts) resolviendo el modo del tema (M44) y el último snapshot
 * guardado en MMKV.
 */

/**
 * M44 · paleta resuelta del widget según el modo (light/dark/system).
 * Se lee en cada render — el widget se redibuja al guardarse el snapshot,
 * al cambiar el tema desde Perfil y con el update periódico del sistema.
 */
function widgetColors(): typeof palette {
  // darkPalette es Record<string> (hex literales) — mismo cast que ThemeProvider.
  const dark = darkPalette as unknown as typeof palette;
  const stored = prefs.getString(PrefKeys.themeMode);
  if (stored === 'dark') return dark;
  if (stored === 'light') return palette;
  try {
    return Appearance.getColorScheme() === 'dark' ? dark : palette;
  } catch {
    return palette;
  }
}

export interface WidgetHabit {
  icon: string;
  name: string;
  done: boolean;
}

interface WidgetSnapshot {
  completed: number;
  total: number;
  habits: WidgetHabit[];
  /** M44 · meta semanal (0 = sin meta configurada). */
  weekDone: number;
  weekTarget: number;
}

const SNAPSHOT_KEY = 'widget.snapshot';
/** Hábitos mostrados como máximo en el widget. */
const MAX_ROWS = 3;

export function saveWidgetSnapshot(snapshot: WidgetSnapshot): void {
  prefs.set(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

function readSnapshot(): WidgetSnapshot {
  try {
    const raw = prefs.getString(SNAPSHOT_KEY);
    if (raw) return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    /* snapshot corrupto → vacío */
  }
  return { completed: 0, total: 0, habits: [], weekDone: 0, weekTarget: 0 };
}

/** JSX del widget — se renderiza tanto desde la app como desde el task handler. */
export function HabitWidgetScreen({ snapshot }: { snapshot: WidgetSnapshot }) {
  const rows = snapshot.habits.slice(0, MAX_ROWS);
  const c = widgetColors();
  const weekMet = (snapshot.weekDone ?? 0) >= (snapshot.weekTarget ?? 0);
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: c.surfaceAlt,
        borderRadius: 20,
        padding: 14,
        flexGap: 8,
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextWidget
          text="Hábitos"
          style={{ fontWeight: '800', fontSize: 14, color: c.primary }}
        />
        <TextWidget
          text={`${snapshot.completed}/${snapshot.total} hoy`}
          style={{ fontWeight: '700', fontSize: 13, color: c.text }}
        />
      </FlexWidget>
      {/* M44 · meta semanal en el widget */}
      {snapshot.weekTarget ? (
        <TextWidget
          text={`🎯 Meta semanal: ${Math.min(snapshot.weekDone, snapshot.weekTarget)}/${
            snapshot.weekTarget
          } días${weekMet ? ' ✓' : ''}`}
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: weekMet ? c.success : c.textMuted,
          }}
        />
      ) : null}
      {rows.length === 0 ? (
        <TextWidget
          text="Sin hábitos para hoy — abre la app ✦"
          style={{ fontSize: 12, color: c.textMuted }}
        />
      ) : (
        rows.map((h) => (
          <FlexWidget
            key={h.name}
            style={{ flexDirection: 'row', alignItems: 'center', flexGap: 8 }}
          >
            <TextWidget text={h.icon} style={{ fontSize: 14 }} />
            <TextWidget
              text={h.name}
              truncate="END"
              maxLines={1}
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: h.done ? c.textMuted : c.text,
              }}
            />
            <TextWidget
              text={h.done ? '✓' : '○'}
              style={{ fontSize: 13, fontWeight: '700', color: h.done ? c.success : c.border }}
            />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}

/** JSX del widget compacto 2×1 (M40): contador grande + H + progreso. */
export function HabitWidgetSmallScreen({ snapshot }: { snapshot: WidgetSnapshot }) {
  const pct = snapshot.total > 0 ? Math.round((snapshot.completed / snapshot.total) * 100) : 0;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: palette.primary,
        borderRadius: 20,
        padding: 10,
        flexGap: 4,
      }}
    >
      <TextWidget
        text="H"
        style={{ fontWeight: '900', fontSize: 22, color: palette.surface }}
      />
      <TextWidget
        text={`${snapshot.completed}/${snapshot.total}`}
        style={{ fontWeight: '800', fontSize: 18, color: palette.surface }}
      />
      <TextWidget
        text={`${pct}%`}
        style={{ fontSize: 11, color: palette.surface }}
      />
    </FlexWidget>
  );
}

/** Pide al sistema redibujar todos los widgets con el snapshot actual. */
export async function syncHabitWidget(): Promise<void> {
  const snapshot = readSnapshot();
  try {
    await requestWidgetUpdate({
      widgetName: 'HabitWidget',
      renderWidget: () => <HabitWidgetScreen snapshot={snapshot} />,
    });
  } catch {
    /* best-effort */
  }
  try {
    await requestWidgetUpdate({
      widgetName: 'HabitWidgetSmall',
      renderWidget: () => <HabitWidgetSmallScreen snapshot={snapshot} />,
    });
  } catch {
    /* best-effort */
  }
}

/**
 * Handler del sistema: mantiene ambos widgets vivos (añadidos/actualizados/
 * redimensionados) y re-renderiza al tocarlos. El tap con OPEN_APP lo resuelve Android.
 */
registerWidgetTaskHandler(async (props) => {
  if (props.widgetAction === 'WIDGET_DELETED') return;
  const snapshot = readSnapshot();
  const name = props.widgetInfo.widgetName;
  if (name === 'HabitWidgetSmall') {
    props.renderWidget(<HabitWidgetSmallScreen snapshot={snapshot} />);
  } else {
    props.renderWidget(<HabitWidgetScreen snapshot={snapshot} />);
  }
});
