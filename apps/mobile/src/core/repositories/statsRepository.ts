import { getDb } from '../data/database';

/** Consultas globales de estadísticas (fuera del contrato de repositorios). */
export const statsRepository = {
  /** Días con ≥1 hábito completado en el rango (calendario global). */
  async getMonthCompletedDates(from: string, to: string): Promise<string[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ log_date: string }>(
      `SELECT DISTINCT log_date FROM habit_log
       WHERE completed = 1 AND log_date >= ? AND log_date <= ?
       ORDER BY log_date`,
      from,
      to,
    );
    return rows.map((r) => r.log_date);
  },
};
