import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, spacing } from '@/core/theme/theme';
import { Badge } from '@/ui/feedback/Badge';
import { EmptyState } from '@/ui/feedback/EmptyState';
import { Progress } from '@/ui/feedback/Progress';
import { Skeleton } from '@/ui/feedback/Skeleton';
import { Spinner } from '@/ui/feedback/Spinner';
import { useToast } from '@/ui/feedback/Toast';
import { AppBar } from '@/ui/navigation/AppBar';
import { ChipsTabs } from '@/ui/navigation/ChipsTabs';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { ClayCheckbox } from '@/ui/primitives/ClayCheckbox';
import { ClayInput } from '@/ui/primitives/ClayInput';
import { ClayRadio } from '@/ui/primitives/ClayRadio';
import { ClayToggle } from '@/ui/primitives/ClayToggle';

const TAB_OPTIONS = ['todos', 'bienestar', 'meta', 'habito'] as const;

export default function ShowcaseScreen() {
  const toast = useToast();
  const [name, setName] = useState('');
  const [toggled, setToggled] = useState(true);
  const [checked, setChecked] = useState(false);
  const [radio, setRadio] = useState<'a' | 'b'>('a');
  const [chip, setChip] = useState<(typeof TAB_OPTIONS)[number]>('todos');

  return (
    <View style={styles.screen}>
      <AppBar title="Design System" />
      <ScrollView contentContainerStyle={styles.body} style={styles.flex}>
        <Text style={styles.section}>Botones</Text>
        <ClayButton label="Primario" onPress={() => toast.show('¡Listo!')} />
        <ClayButton label="Secundario" variant="secondary" onPress={() => {}} />
        <ClayButton label="Ghost" variant="ghost" onPress={() => {}} />
        <ClayButton label="Peligro" variant="danger" onPress={() => toast.show('Cuidado', 'error')} />
        <ClayButton label="Deshabilitado" disabled onPress={() => {}} />
        <ClayButton label="Cargando" loading onPress={() => {}} />

        <Text style={styles.section}>Inputs</Text>
        <ClayInput
          label="Nombre del hábito"
          placeholder="Ej. Beber agua"
          value={name}
          onChangeText={setName}
          helper="Máximo 60 caracteres"
        />
        <ClayInput label="Con error" placeholder="Requerido" error="Este campo es obligatorio" value="" onChangeText={() => {}} />

        <Text style={styles.section}>Controles</Text>
        <ClayToggle value={toggled} onValueChange={setToggled} />
        <ClayCheckbox checked={checked} onCheckedChange={setChecked} label="Recordatorio diario" />
        <ClayRadio selected={radio === 'a'} onSelect={() => setRadio('a')} label="Opción A" />
        <ClayRadio selected={radio === 'b'} onSelect={() => setRadio('b')} label="Opción B" />

        <Text style={styles.section}>Chips-tabs</Text>
        <ChipsTabs options={TAB_OPTIONS} value={chip} onChange={setChip} />

        <Text style={styles.section}>Feedback</Text>
        <View style={styles.row}>
          <Badge label="Nuevo" tint="purple" />
          <Badge label="Racha 7" tint="warning" />
          <Badge label="Meta" tint="success" />
          <Badge label="Falla" tint="danger" />
        </View>
        <Progress progress={0.66} />
        <View style={styles.row}>
          <Spinner size="small" />
          <Skeleton width={120} height={14} />
        </View>
        <ClayButton label="Mostrar Toast" variant="secondary" onPress={() => toast.show('Check-in guardado', 'success')} />

        <Text style={styles.section}>Empty state</Text>
        <ClayCard>
          <EmptyState
            title="Aún no tienes hábitos"
            description="Crea el primero y empieza tu racha hoy."
            blob="✦"
            action={<ClayButton label="Crear hábito" onPress={() => toast.show('M6: abrirá el sheet')} />}
          />
        </ClayCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  section: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 16,
    color: palette.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
