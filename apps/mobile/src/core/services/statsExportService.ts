import { localDateISO } from '@habitos/shared';
import { Directory, File, Paths } from 'expo-file-system';
import { buildCsv } from '@/core/domain/services/csv';
import { getDb } from '@/core/data/database';

interface LogRow {
  log_date: string;
  name: string;
  category: string;
  completed: number;
  created_at: string;
  completed_at: string | null;
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return localDateISO(date);
}

/**
 * M32 · exporta los check-ins de los últimos365 días como CSV
 * (fecha, hábito, categoría, completado, registro). Devuelve el URI del archivo.
 */
async function exportHabitLogCsv(): Promise<string> {
  const db = await getDb();
  const from = addDaysISO(localDateISO(), -364);
  const rows = await db.getAllAsync<LogRow>(
    `SELECT l.log_date, h.name, h.category, l.completed, l.created_at, l.completed_at
     FROM habit_log l JOIN habit h ON h.id = l.habit_id
     WHERE l.log_date >= ?
     ORDER BY l.log_date DESC, h.name`,
    from,
  );

  const csv = buildCsv(
    ['fecha', 'habito', 'categoria', 'completado', 'registrado_en'],
    rows.map((r) => [
      r.log_date,
      r.name,
      r.category,
      r.completed === 1 ? 1 : 0,
      r.completed_at ?? r.created_at,
    ]),
  );

  const dir = new Directory(Paths.cache, 'exports');
  if (!dir.exists) dir.create({ intermediates: true });
  const file = new File(dir, `habitos-datos-${localDateISO()}.csv`);
  file.write(csv);
  return file.uri;
}

export const statsExportService = {
  exportHabitLogCsv,
};
