import { localDateISO } from '@habitos/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, spacing } from '@/core/theme/theme';
import { useAppTheme } from '@/core/theme/ThemeProvider';
import {
  useMotivationQueue,
  useShowMotivation,
  useUnshowMotivation,
} from './useMotivations';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { SwipeCard } from '@/ui/primitives/SwipeCard';

/**
 * MotivationCard (V2 · HU-25 · F16/F17 · R11) — muestra la cola del día en
 * SwipeCard (umbral 90 px, stamps, reduced-motion y botones accesibles ya
 * integrados). Guardar/Descartar marcan MOTIVATION_SHOW (no se repite hoy);
 * «Deshacer» revierte la exclusión vía unmarkShown.
 */
export function MotivationCard() {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          gap: spacing.sm,
        },
        undoRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          paddingHorizontal: spacing.sm,
        },
        undoText: {
          flex: 1,
          fontFamily: fonts.body,
          fontSize: 12,
          color: colors.textMuted,
        },
      }),
    [colors],
  );
  const queue = useMotivationQueue();
  const show = useShowMotivation();
  const unshow = useUnshowMotivation();
  const [index, setIndex] = useState(0);
  const [lastShown, setLastShown] = useState<{ id: string; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (queue.isPending || queue.isError) return null;
  const items = queue.data ?? [];
  const current = items[index];
  if (!current) {
    if (!lastShown) return null;
    return (
      <View style={styles.undoRow}>
        <Text style={styles.undoText}>«{lastShown.text}» guardada para hoy</Text>
        <ClayButton
          label="Deshacer"
          variant="ghost"
          disabled={unshow.isPending}
          onPress={() => {
            const id = lastShown.id;
            setLastShown(null);
            if (timer.current) clearTimeout(timer.current);
            unshow.mutate({ motivationId: id, shownOn: localDateISO() }, {
              onSuccess: () => setIndex(0),
            });
          }}
        />
      </View>
    );
  }

  const finish = () => {
    setIndex((i) => i + 1);
    setLastShown({ id: current.id, text: current.text });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLastShown(null), 6000);
  };

  const markShown = () => show.mutate({ motivationId: current.id, shownOn: localDateISO() });

  return (
    <View style={styles.wrap}>
      <SwipeCard
        emoji={current.emoji}
        title={current.text}
        subtitle={current.goalTitle ? `Meta: ${current.goalTitle}` : 'Para ti hoy'}
        onGuardar={() => { markShown(); finish(); }}
        onDescartar={() => { markShown(); finish(); }}
      />
      {lastShown ? (
        <View style={styles.undoRow}>
          <Text style={styles.undoText}>Descartada · no se repetirá hoy</Text>
          <ClayButton
            label="Deshacer"
            variant="ghost"
            disabled={unshow.isPending}
            onPress={() => {
              const id = lastShown.id;
              setLastShown(null);
              if (timer.current) clearTimeout(timer.current);
              unshow.mutate({ motivationId: id, shownOn: localDateISO() }, {
                onSuccess: () => setIndex((i) => Math.max(0, i - 1)),
              });
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
