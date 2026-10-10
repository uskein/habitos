import { StyleSheet, Text, View } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';

export interface HourlyChartProps {
  hourly: number[];
  /** Sin datos (todos 0) → no se dibuja el gráfico. */
  emptyLabel?: string;
}

/** HU-20/HU-26 — distribución por hora con hora pico (Victory). */
export function HourlyChart({ hourly, emptyLabel = 'Sin datos de hora' }: HourlyChartProps) {
  const data = hourly
    .map((n, h) => ({ h: `${String(h).padStart(2, '0')}`, n }))
    .filter((d) => d.n > 0);
  const peak = data.reduce<(typeof data)[number] | null>((best, d) => (!best || d.n > best.n ? d : best), null);

  if (!peak) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.peak}>
        <Text style={styles.peakValue}>{peak.h}:00</Text> · {peak.n} registro{peak.n === 1 ? '' : 's'}
      </Text>
      <View style={styles.chartBox}>
        <CartesianChart
          data={data}
          xKey="h"
          yKeys={['n']}
          padding={{ left: 8, right: 8, top: 8, bottom: 20 }}
          axisOptions={{
            lineColor: palette.border,
            labelColor: palette.textMuted,
            tickCount: { x: 6, y: 4 },
          }}
        >
          {({ points, chartBounds }) => (
            <Bar
              points={points.n}
              chartBounds={chartBounds}
              color={palette.primary}
              roundedCorners={{ topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 }}
            />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  peak: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textMuted,
  },
  peakValue: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 15,
    color: palette.primary,
  },
  chartBox: {
    height: 160,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  emptyBox: {
    height: 80,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textMuted,
  },
});
