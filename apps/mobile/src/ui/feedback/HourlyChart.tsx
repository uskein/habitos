import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Bar, CartesianChart } from 'victory-native';
import { fonts, radii, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';

export interface HourlyChartProps {
  hourly: number[];
  /** Sin datos (todos 0) → no se dibuja el gráfico. */
  emptyLabel?: string;
}

/** HU-20/HU-26 — distribución por hora con hora pico (Victory). */
export function HourlyChart({ hourly, emptyLabel = 'Sin datos de hora' }: HourlyChartProps) {
  const { colors } = useAppTheme();

  const data = hourly
    .map((n, h) => ({ h: `${String(h).padStart(2, '0')}`, n }))
    .filter((d) => d.n > 0);
  const peak = data.reduce<(typeof data)[number] | null>((best, d) => (!best || d.n > best.n ? d : best), null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          gap: spacing.sm,
        },
        peak: {
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.textMuted,
        },
        peakValue: {
          fontFamily: fonts.mono,
          fontWeight: '700',
          fontSize: 15,
          color: colors.primary,
        },
        chartBox: {
          height: 160,
          backgroundColor: colors.surfaceAlt,
          borderRadius: radii.md,
          paddingVertical: spacing.sm,
        },
        emptyBox: {
          height: 80,
          backgroundColor: colors.surfaceAlt,
          borderRadius: radii.md,
          alignItems: 'center',
          justifyContent: 'center',
        },
        emptyText: {
          fontFamily: fonts.body,
          fontSize: 13,
          color: colors.textMuted,
        },
      }),
    [colors],
  );

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
            lineColor: colors.border,
            labelColor: colors.textMuted,
            tickCount: { x: 6, y: 4 },
          }}
        >
          {({ points, chartBounds }) => (
            <Bar
              points={points.n}
              chartBounds={chartBounds}
              color={colors.primary}
              roundedCorners={{ topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 }}
            />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}
