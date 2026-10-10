/** Entidades MILESTONE / MILESTONE_IMAGE / MILESTONE_LINK — MODELO §2.8 */

export type MilestoneEntityType = 'habit' | 'goal';

export interface MilestoneImage {
  id: string;
  milestoneId: string;
  uri: string;
  position: number;
}

export interface MilestoneLink {
  milestoneId: string;
  entityType: MilestoneEntityType;
  entityId: string;
}

export interface Milestone {
  id: string;
  userId: string;
  title: string;
  note: string | null;
  occurredAt: string;
  createdAt: string;
  syncState: 'pending' | 'synced';
}

export interface MilestoneWithMedia extends Milestone {
  images: MilestoneImage[];
  links: MilestoneLink[];
}
