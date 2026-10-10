/** Entidad WELL_ENTRY — MODELO_DE_DATOS §2.6 */

export interface WellEntry {
  id: string;
  entryDate: string;
  mood: number;
  energy: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'deleted';
}
