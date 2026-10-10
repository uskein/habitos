import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useQueryClient } from '@tanstack/react-query';
import { fonts, palette, radii, spacing } from '@/core/theme/theme';
import { backupService } from '@/core/services/backupService';
import { systemSheet } from '@/core/storage/systemSheet';
import { useToast } from '@/ui/feedback/Toast';
import { ClayButton } from '@/ui/primitives/ClayButton';
import { ClayCard } from '@/ui/primitives/ClayCard';
import { ClayInput } from '@/ui/primitives/ClayInput';

/**
 * Sheet Backup y restauración — HU-28 · F21.
 * Errores en pantalla (R9): BACKUP_PASSWORD_INVALID / BACKUP_CORRUPT con reintento in-situ.
 */
export default function BackupSheet() {
  const toast = useToast();
  const qc = useQueryClient();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);

  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [importPassword, setImportPassword] = useState('');
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportError =
    touched && password.length > 0 && password.length < 4
      ? 'Mínimo 4 caracteres'
      : touched && password !== confirm
        ? 'Las contraseñas no coinciden'
        : undefined;

  const runExport = () => {
    setTouched(true);
    setError(null);
    if (password.length < 4 || password !== confirm) return;
    setBusy('export');
    void (async () => {
      try {
        const uri = await backupService.exportEncrypted(password);
        if (await Sharing.isAvailableAsync()) {
          await systemSheet.run(() =>
            Sharing.shareAsync(uri, { dialogTitle: 'Guardar backup cifrado' }),
          );
        }
        toast.show('Backup generado 🔒', 'success');
        setPassword('');
        setConfirm('');
        setTouched(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'No se pudo generar el backup';
        setError(msg);
      } finally {
        setBusy(null);
      }
    })();
  };

  const pickFile = async () => {
    setError(null);
    const res = await systemSheet.run(() =>
      DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      }),
    );
    if (res.canceled || !res.assets[0]) return;
    setPickedUri(res.assets[0].uri);
    setPickedName(res.assets[0].name ?? 'backup.habitos');
  };

  const runImport = () => {
    setError(null);
    if (!pickedUri) {
      setError('Elige primero el archivo de backup');
      return;
    }
    setBusy('import');
    void (async () => {
      try {
        await backupService.importEncrypted(pickedUri, importPassword);
        qc.invalidateQueries(); // estado importado → refrescar todo
        toast.show('Backup restaurado ✅', 'success');
        router.back();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'No se pudo restaurar el backup';
        setError(msg); // R9: error en pantalla con reintento in-situ
      } finally {
        setBusy(null);
      }
    })();
  };

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Backup y restauración</Text>
      <Text style={styles.lead}>
        Exporta hábitos, metas, logs, logros, hitos y fotos en un archivo cifrado con tu
        contraseña (scrypt + AES-256-GCM).
      </Text>

      <ClayCard style={styles.card}>
        <Text style={styles.cardTitle}>Exportar</Text>
        <ClayInput
          label="Contraseña del backup"
          secureTextEntry
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
          onBlur={() => setTouched(true)}
          error={exportError}
          placeholder="Mínimo 4 caracteres"
        />
        <ClayInput
          label="Repite la contraseña"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          onBlur={() => setTouched(true)}
          error={touched && confirm.length > 0 && confirm !== password ? 'No coinciden' : undefined}
        />
        <ClayButton
          label={busy === 'export' ? 'Generando…' : 'Exportar backup cifrado'}
          onPress={runExport}
          disabled={busy !== null}
        />
      </ClayCard>

      <ClayCard style={styles.card}>
        <Text style={styles.cardTitle}>Importar</Text>
        <ClayButton
          label={pickedName ?? 'Elegir archivo de backup'}
          variant="secondary"
          onPress={() => void pickFile()}
          disabled={busy !== null}
        />
        <ClayInput
          label="Contraseña del archivo"
          secureTextEntry
          value={importPassword}
          onChangeText={setImportPassword}
          placeholder="La que usaste al exportar"
        />
        <ClayButton
          label={busy === 'import' ? 'Restaurando…' : 'Restaurar (reemplaza los datos)'}
          onPress={runImport}
          disabled={busy !== null}
        />
        {pickedUri && (
          <View style={styles.fileRow}>
            <Text style={styles.fileHint}>Archivo listo · la restauración usa transacción con rollback</Text>
          </View>
        )}
      </ClayCard>

      {error && (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
          <ClayButton label="Reintentar" variant="ghost" onPress={() => setError(null)} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 22,
    color: palette.text,
  },
  lead: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.textMuted,
  },
  card: {
    gap: spacing.md,
    padding: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 16,
    color: palette.text,
  },
  fileRow: {
    gap: 2,
  },
  fileHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
  },
  errorBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.error,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.error,
  },
});
