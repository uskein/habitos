import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Line, LinearGradient, Path, Skia } from '@shopify/react-native-skia';
import { palette, veils } from '@/core/theme/theme';

export interface ClaySparklineProps {
  /** Valores 0–100. */
  data: number[];
  width?: number;
  height?: number;
  accessibilityLabel?: string;
}

/**
 * ClaySparkline (V2 · manual §8.2) — línea 2.5 px con gradiente lineal
 * primary → secondary, relleno de área `chartArea` (primary @12 %) y punto
 * final 4 px secondary. Canvas Skia puro (sin hilo JS en el trazado).
 */
export function ClaySparkline({
  data,
  width = 280,
  height = 72,
  accessibilityLabel,
}: ClaySparklineProps) {
  const pad = 6;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const n = Math.max(data.length - 1, 1);

  const xFor = (i: number) => pad + (i / n) * w;
  const yFor = (v: number) => pad + h - (Math.max(0, Math.min(100, v)) / 100) * h;

  const line = Skia.Path.Make();
  data.forEach((v, i) => {
    const x = xFor(i);
    const y = yFor(v);
    if (i === 0) line.moveTo(x, y);
    else line.lineTo(x, y);
  });

  const area = Skia.Path.Make();
  data.forEach((v, i) => {
    const x = xFor(i);
    const y = yFor(v);
    if (i === 0) area.moveTo(x, y);
    else area.lineTo(x, y);
  });
  area.lineTo(xFor(data.length - 1), pad + h);
  area.lineTo(xFor(0), pad + h);
  area.close();

  const lastX = xFor(data.length - 1);
  const lastY = yFor(data[data.length - 1] ?? 0);

  return (
    <View
      style={{ width, height }}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `Tendencia de ${data.length} puntos`}
    >
      <Canvas style={styles.canvas}>
        <Path path={area} color={palette.chartArea} />
        <Path path={line} style="stroke" strokeWidth={2.5} strokeCap="round" strokeJoin="round">
          <LinearGradient
            start={{ x: pad, y: 0 }}
            end={{ x: width - pad, y: 0 }}
            colors={[palette.primary, palette.secondary]}
          />
        </Path>
        <Line p1={{ x: pad, y: pad + h }} p2={{ x: width - pad, y: pad + h }} color={veils.light} strokeWidth={1} />
        <Circle cx={lastX} cy={lastY} r={4} color={palette.secondary} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1 },
});
