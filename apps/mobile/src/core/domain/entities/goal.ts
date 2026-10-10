/** Entidades GOAL / GOAL_UPDATE — MODELO_DE_DATOS §2.5 */

export type GoalStatus = 'active' | 'completed' | 'abandoned';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  targetValue: number;
  currentValue: number;
  unit: string | null;
  deadline: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'deleted';
}

export interface GoalUpdate {
  id: string;
  goalId: string;
  delta: number;
  note: string | null;
  entryDate: string;
  createdAt: string;
}
