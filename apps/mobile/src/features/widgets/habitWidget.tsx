import {
  FlexWidget,
  TextWidget,
  registerWidgetTaskHandler,
  requestWidgetUpdate,
} from 'react-native-android-widget';
import { prefs } from '@/core/storage/preferences';
import { palette } from '@/core/theme/theme';

/**
 * M34 · Widget de Android (HabitWidget).
 * El widget vive fuera del árbol React de la app: usa colores estáticos del
 * Design System (theme.ts) y lee el último snapshot guardado en MMKV.
 */

export interface WidgetHabit {
  icon: string;
  name: string;
  done: boolean;
}

interface WidgetSnapshot {
  completed: number;
  total: number;
  habits: WidgetHabit[];
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
  return { completed: 0, total: 0, habits: [] };
}

/** JSX del widget — se renderiza tanto desde la app como desde el task handler. */
export function HabitWidgetScreen({ snapshot }: { snapshot: WidgetSnapshot }) {
  const rows = snapshot.habits.slice(0, MAX_ROWS);
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: palette.surfaceAlt,
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
          style={{ fontWeight: '800', fontSize: 14, color: palette.primary }}
        />
        <TextWidget
          text={`${snapshot.completed}/${snapshot.total} hoy`}
          style={{ fontWeight: '700', fontSize: 13, color: palette.text }}
        />
      </FlexWidget>
      {rows.length === 0 ? (
        <TextWidget
          text="Sin hábitos para hoy — abre la app ✦"
          style={{ fontSize: 12, color: palette.textMuted }}
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
                color: h.done ? palette.textMuted : palette.text,
              }}
            />
            <TextWidget
              text={h.done ? '✓' : '○'}
              style={{ fontSize: 13, fontWeight: '700', color: h.done ? palette.success : palette.border }}
            />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}

/** Pide al sistema redibujar todos los widgets con el snapshot actual. */
export async function syncHabitWidget(): Promise<void> {
  try {
    await requestWidgetUpdate({
      widgetName: 'HabitWidget',
      renderWidget: () => <HabitWidgetScreen snapshot={readSnapshot()} />,
    });
  } catch {
    /* best-effort: sin widgets en home no hay nada que redibujar */
  }
}

/**
 * Handler del sistema: mantiene el widget vivo (añadido/actualizado/redimensionado)
 * y re-renderiza al tocarlo. El tap con OPEN_APP lo resuelve Android.
 */
registerWidgetTaskHandler(async (props) => {
  if (props.widgetAction === 'WIDGET_DELETED') return;
  props.renderWidget(<HabitWidgetScreen snapshot={readSnapshot()} />);
});
