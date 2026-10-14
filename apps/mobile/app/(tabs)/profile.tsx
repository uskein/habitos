import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { authRepository } from '@/core/repositories/authRepository';
import {
  ensurePermissionAsync,
  remindersEnabled,
  setRemindersEnabled,
} from '@/core/services/notificationService';
import { PrefKeys, prefs } from '@/core/storage/preferences';
import { sessionBus } from '@/core/storage/sessionBus';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import { useAchievements } from '@/features/achievements/useAchievements';
import { useGoals } from '@/features/goals/useGoals';
import { useGlobalStreak, useHabitsToday, useProfile } from '@/features/habits/useHabits';
import { useAvatarPicker } from '@/features/settings/useAvatarPicker';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { useToast } from '@/ui/feedback/Toast';
import { ClayAvatar } from '@/ui/primitives/ClayAvatar';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { ClayToggle } from '@/ui/primitives/ClayToggle';

/** Tab Perfil — M8: identidad, seguridad, datos (blueprint §1). */
export default function ProfileScreen() {
  const toast = useToast();
  const profile = useProfile();
  const streak = useGlobalStreak();
  const achievements = useAchievements();
  const goals = useGoals('active');
  const todayHabits = useHabitsToday();
  const avatar = useAvatarPicker();
  const [remindersOn, setRemindersOn] = useState(remindersEnabled);

  if (profile.isPending || streak.isPending || achievements.isPending) {
    return (
      <View style={styles.screen}>
        <View style={styles.body}>
          <Skeleton height={96} borderRadius={24} />
          <Skeleton height={160} borderRadius={24} />
          <Skeleton height={200} borderRadius={24} />
        </View>
      </View>
    );
  }

  if (profile.isError || streak.isError || achievements.isError) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <EmptyState
            title="No se pudo cargar el perfil"
            description="Error leyendo la base local."
            blob="⚠"
            action={<ClayButton label="Reintentar" onPress={() => void profile.refetch()} />}
          />
        </View>
      </View>
    );
  }

  const p = profile.data;
  if (!p) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <EmptyState
            title="Sin perfil"
            description="Completa el onboarding para usar la app."
            blob="◌"
            action={<ClayButton label="Ir al inicio" onPress={() => sessionBus.requestLock()} />}
          />
        </View>
      </View>
    );
  }

  const level = Math.min(10, Math.floor((streak.data?.bestStreak ?? 0) / 3) + 1);
  const biometrics = prefs.getBoolean(PrefKeys.biometrics) ?? false;
  const lockEnabled = prefs.getBoolean(PrefKeys.lockEnabled) ?? false;
  const medals = achievements.data!.unlocked.length;
  const totalMedals = achievements.data!.catalog.length;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(240)}>
          <ClayCard style={styles.identity}>
            <ClayAvatar
              name={p.displayName}
              size={56}
              photoUri={p.photoUri}
              onPressCamera={() => void avatar.pickPhoto()}
              style={styles.avatar}
            />
            <View style={styles.identityTexts}>
              <Text style={styles.name} numberOfLines={1}>
                {p.displayName}
              </Text>
              <Text style={styles.level}>
                Nivel {level} · mejor racha {streak.data?.bestStreak ?? 0} 🔥
              </Text>
            </View>
            <ClayButton label="Editar" variant="ghost" onPress={() => router.push('/(modals)/edit-profile')} />
          </ClayCard>
        </Animated.View>

        <Section title="Bienestar">
          <Row label="Check-in de hoy" sub="Ánimo y energía en 1 toque">
            <ClayButton
              label="Abrir"
              variant="secondary"
              onPress={() => router.push('/(modals)/check-in')}
            />
          </Row>
        </Section>

        <Section title="Seguridad">
          <Row label="Cambiar PIN" sub="Requiere el PIN actual">
            <ClayButton
              label="Cambiar"
              variant="secondary"
              onPress={() => router.push('/(modals)/change-pin')}
            />
          </Row>
          <Row
            label="Desbloqueo biométrico"
            sub="Usa la huella o cara del dispositivo"
            toggle={{
              value: biometrics,
              onChange: (v) => {
                prefs.set(PrefKeys.biometrics, v);
                toast.show(v ? 'Biometría activada' : 'Biometría desactivada', 'success');
              },
            }}
          />
          <Row
            label="Bloqueo automático"
            sub="Pide PIN al pasar la app a segundo plano"
            toggle={{
              value: lockEnabled,
              onChange: (v) => {
                prefs.set(PrefKeys.lockEnabled, v);
                toast.show(v ? 'Bloqueo activado' : 'Bloqueo desactivado', 'success');
              },
            }}
          />
          <ClayButton
            label="Bloquear ahora"
            variant="secondary"
            onPress={() => {
              void authRepository.isPinConfigured().then((hasPin) => {
                if (hasPin && lockEnabled) {
                  sessionBus.requestLock();
                } else {
                  toast.show('Activa el bloqueo automático primero', 'error');
                }
              });
            }}
          />
        </Section>

        <Section title="Datos">
          <View style={styles.statsRow}>
            <Stat label="Medallas" value={`${medals}/${totalMedals}`} />
            <Stat label="Metas activas" value={`${goals.data?.length ?? 0}`} />
            <Stat label="Hábitos hoy" value={`${todayHabits.data?.length ?? 0}`} />
          </View>
          <Row
            label="Notificaciones"
            sub="Recordatorios diarios por hábito"
            toggle={{
              value: remindersOn,
              onChange: (v) => {
                void (async () => {
                  if (v) {
                    const ok = await ensurePermissionAsync();
                    if (!ok) {
                      toast.show('Permiso de notificaciones denegado', 'error');
                      return;
                    }
                  }
                  await setRemindersEnabled(v);
                  setRemindersOn(v);
                  toast.show(
                    v ? 'Recordatorios activados' : 'Recordatorios desactivados',
                    'success',
                  );
                })();
              },
            }}
          />
          <ClayButton
            label="Backup y restauración"
            variant="secondary"
            onPress={() => router.push('/(modals)/backup')}
          />
        </Section>

        <Section title="Acerca de">
          <Row label="Créditos" sub="App Hábitos · local-first · v0.2.0 · hecho con ❤ y Expo">
            <ClayButton
              label="Repositorio"
              variant="secondary"
              onPress={() =>
                void Linking.openURL('https://github.com/uskein/habitos').catch(() =>
                  toast.show('No se pudo abrir el enlace', 'error'),
                )
              }
            />
          </Row>
        </Section>

        <Text style={styles.version}>App Hábitos · local-first · v0.2.0</Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ClayCard style={styles.sectionCard}>{children}</ClayCard>
    </View>
  );
}

function Row({
  label,
  sub,
  toggle,
  children,
}: {
  label: string;
  sub?: string;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowTexts}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {toggle ? (
        <ClayToggle value={toggle.value} onValueChange={toggle.onChange} />
      ) : (
        children
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    alignSelf: 'auto',
  },
  identityTexts: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 20,
    color: palette.text,
  },
  level: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 16,
    color: palette.text,
    marginLeft: 4,
  },
  sectionCard: {
    gap: 0,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowTexts: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 15,
    color: palette.text,
  },
  rowSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: palette.surfaceAlt,
    borderRadius: radii.lg,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 18,
    color: palette.primary,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: palette.textMuted,
  },
  version: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
