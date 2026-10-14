import { StyleSheet, Text, View, ScrollView } from 'react-native';
import type { HeatmapWeek } from '@/core/domain/services/heatmap';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';

const CELL = 11;
const GAP = 2;

/** Rampas de intensidad 0–4 con tokens del Design System (sin hex fuera de theme). */
const LEVEL_BG = [
  palette.surfaceAlt,
  palette.track,
  palette.primarySoft,
  palette.primary,
  palette.primaryActive,
] as const;

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface YearHeatmapProps {
  weeks: HeatmapWeek[];
  labels: (number | null)[];
}

/**
 * M31 · heatmap anual estilo GitHub —365 días en columnas lun→dom,
 * intensidad = % del máximo de actividad del periodo.
 */
export function YearHeatmap({ weeks, labels }: YearHeatmapProps) {
  const rowDays = [0, 1, 2, 3, 4, 5, 6];
  const totalDays = weeks.flat().filter((c) => c.date !== null).length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Actividad del año</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.labelsRow}>
            {labels.map((month, i) => (
              <View key={i} style={styles.labelSlot}>
                {month !== null ? (
                  <Text style={styles.monthLabel}>{MONTHS_ES[month]}</Text>
                ) : null}
              </View>
            ))}
          </View>
          <View style={styles.gridWrap}>
            <View style={styles.weekdays}>
              <Text style={styles.weekday}>L</Text>
              <Text style={styles.weekday}>X</Text>
              <Text style={styles.weekday}>V</Text>
            </View>
            <View style={styles.grid}>
              {rowDays.map((dayIdx) => (
                <View key={dayIdx} style={styles.row}>
                  {weeks.map((week, wi) => {
                    const cell = week[dayIdx];
                    if (!cell) return <View key={wi} style={styles.cell} />;
                    return (
                      <View
                        key={wi}
                        style={[
                          styles.cell,
                          { backgroundColor: LEVEL_BG[cell.level] },
                          cell.isToday && styles.cellToday,
                        ]}
                        accessibilityLabel={
                          cell.date
                            ? `${cell.date}: ${cell.count} hábitos completados`
                            : undefined
                        }
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{totalDays} días con actividad registrada</Text>
        <View style={styles.legend}>
          <Text style={styles.legendText}>Menos</Text>
          {LEVEL_BG.map((bg) => (
            <View key={bg} style={[styles.cell, { backgroundColor: bg }]} />
          ))}
          <Text style={styles.legendText}>Más</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 17,
    color: palette.text,
  },
  labelsRow: {
    flexDirection: 'row',
    marginLeft: 26,
    height: 16,
  },
  labelSlot: {
    width: CELL + GAP,
  },
  monthLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: palette.textMuted,
  },
  gridWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  weekdays: {
    width: 20,
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  weekday: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: palette.textMuted,
    lineHeight: CELL + GAP,
  },
  grid: {
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 3,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: palette.primaryActive,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: palette.textMuted,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: palette.textMuted,
    marginHorizontal: 2,
  },
});
